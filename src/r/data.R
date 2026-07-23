library(dplyr)
library(purrr)
library(jsonlite)
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

        json_data <- fromJSON(txt = json_url)
        csv_data <- read.csv(csv_url, check.names = FALSE)

        # Check if API itself returned "error" field
        if ("error" %in% names(csv_data)) {
          stop("API returned error field")
        }

        return(list(json = json_data, csv = csv_data))  # ✅ success, return immediately
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

  all_data[[matrix]]$label <- raw_json$label
  all_data[[matrix]]$updated <- as.Date(raw_json$updated)
  all_data[[matrix]]$subject <- raw_json$extension$subject$code
  all_data[[matrix]]$product <- raw_json$extension$product$code
  
  raw_csv <- raw_data$csv
  
  cols_to_keep <- c()
  
  dimensions <- raw_json$dimension
  
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
  
  csv_wide <- raw_csv |> 
    select(all_of(cols_to_keep)) |> 
    pivot_wider(names_from = all_of(pivot_col), values_from = "VALUE")
  
  write.csv(csv_wide, paste0("public/data/", matrix, ".csv"), row.names = FALSE)
}


write_json(all_data, "public/data/data.json", pretty = TRUE, auto_unbox = TRUE)