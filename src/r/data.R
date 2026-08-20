# Install required packages when the script is run locally.
#
# GitHub Actions installs these dependencies separately in
# .github/workflows/update.yml, so package installation is
# skipped when the script is running there.
running_in_github_actions <- identical(
  Sys.getenv("GITHUB_ACTIONS"),
  "true"
)

required_packages <- c(
  "dplyr",
  "jsonlite",
  "purrr",
  "tidyr",
  "V8"
)

if (!running_in_github_actions) {

  options(
    repos = c(
      CRAN = "https://cran.rstudio.com/"
    )
  )

  installed <- rownames(
    installed.packages()
  )

  missing_packages <- setdiff(
    required_packages,
    installed
  )

  if (length(missing_packages) > 0) {
    install.packages(
      missing_packages
    )
  }
}

library(dplyr)
library(purrr)
library(V8)
library(tidyr)

if (!dir.exists("public")) dir.create("public")
if (!dir.exists("public/data")) dir.create("public/data")

config_file <- readLines("src/config/config.js", warn = FALSE) %>%
  sub("export ", "", .) %>%
  paste(., collapse = "\n")

ctx <- V8::v8()
ctx$eval(config_file)

config <- ctx$get("config")

matrix_list <- config$matrix

# API Key ####
api_key <- "801aaca4bcf0030599c019f4efa8b89032e5e6aa1de4a629a7f7e9a86db7fb8c"

# Fetch dataset function ####

fetch_dataset <- function(matrix,
                          api_key,
                          max_attempts = Inf,
                          wait_seconds = 2) {
  attempt <- 1
  repeat {
    result <- tryCatch(
      {

        json_url <- paste0(
          "https://",
          "ws-data.nisra.gov.uk/public/api.restful/",
          "PxStat.Data.Cube_API.ReadDataset/",
          matrix,
          "/JSON-stat/2.0/en?apiKey=",
          api_key
        )

        csv_url <- paste0(
          "https://",
          "ws-data.nisra.gov.uk/public/api.restful/",
          "PxStat.Data.Cube_API.ReadDataset/",
          matrix,
          "/CSV/1.0/en?apiKey=",
          api_key
        )

        json_data <- jsonlite::fromJSON(txt = json_url)
        csv_data <- read.csv(csv_url, check.names = FALSE)

        # Check if API itself returned "error" field
        if ("error" %in% names(csv_data)) {
          stop("API returned error field")
        }

        return(list(json = json_data, csv = csv_data))
      },
      error = function(e) {
        message(sprintf("Error fetching %s (attempt %d): %s",
                        matrix,
                        attempt, e$message))
        return(NULL)
      }
    )

    if (!is.null(result)) {
      return(result)  # break loop if successful
    }

    attempt <- attempt + 1
    if (attempt > max_attempts) {
      stop("Max attempts reached without success.")
    }

    Sys.sleep(wait_seconds)  # backoff before retry
  }
}

# Fetch data ####
all_data <- list()
for (matrix in matrix_list) {

  raw_data <- fetch_dataset(matrix, api_key)

  raw_json <- raw_data$json
  dimensions <- raw_json$dimension

  variables <- map(names(dimensions), function(var) {
    list(
      code = var,
      name = dimensions[[var]]$label,
      values = dimensions[[var]]$category$label
    )
  })

  all_data[[matrix]]$label <- raw_json$label
  all_data[[matrix]]$updated <- as.Date(raw_json$updated)
  all_data[[matrix]]$subject <- raw_json$extension$subject$code
  all_data[[matrix]]$product <- raw_json$extension$product$code
  all_data[[matrix]]$variables <- variables

  raw_csv <- raw_data$csv

  cols_to_keep <- c()

  for (i in seq_along(dimensions)) {
    dimension_name <- names(dimensions[i])
    dimension_label <- dimensions[[i]]$label
    if (tolower(dimension_name) == tolower(dimension_label)) {
      cols_to_keep <- c(cols_to_keep, paste(dimension_label, "Label"))
    } else {
      cols_to_keep <- c(cols_to_keep, dimension_label)
    }
  }

  pivot_col <- tail(cols_to_keep, 1)

  cols_to_keep <- c(cols_to_keep, "VALUE")

  csv_wide <- raw_csv %>% 
    select(all_of(cols_to_keep)) %>% 
    pivot_wider(names_from = all_of(pivot_col), values_from = "VALUE")

  names(csv_wide) <- gsub(" Label", "", names(csv_wide))

  write.csv(csv_wide, paste0("public/data/", matrix, ".csv"), row.names = FALSE)
}


jsonlite::write_json(
  all_data,
  "public/data/data.json",
  pretty = TRUE,
  auto_unbox = TRUE
)