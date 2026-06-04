library(dplyr)
library(purrr)
library(jsonlite)
library(V8)

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
        url <- paste0(
          "https://",
          "ws-data.nisra.gov.uk/public/api.restful/",
          "PxStat.Data.Cube_API.ReadDataset/",
          matrix,
          "/JSON-stat/2.0/en?apiKey=",
          api_key
        )

        json_data <- fromJSON(txt = url)

        # Check if API itself returned "error" field
        if ("error" %in% names(json_data)) {
          stop("API returned error field")
        }

        return(json_data)  # ✅ success, return immediately
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

  dimensions <- names(raw_data$dimension)
  size <- raw_data$size

  reshaped_data <- data.frame(value = as.numeric(raw_data$value))

  for (i in seq_along(dimensions)) {
    dimension_cats <- unlist(
      raw_data$dimension[[dimensions[[i]]]]$category$label
    )

    dimension_col <- c()

    for (cat in dimension_cats) {
      if (i == length(dimensions)) {
        dimension_col <- c(dimension_col, cat)
      } else {
        dimension_col <- c(
          dimension_col,
          rep(cat, prod(size[(i + 1):length(size)]))
        )
      }

    }

    reshaped_data[[dimensions[i]]] <- dimension_col
  }

  reshaped_data <- reshaped_data %>%
    relocate(value, .after = dimensions[[length(dimensions)]])

  data_list <- list()

  for (i in seq_len(nrow(reshaped_data))) {
    keys <- map(dimensions, ~ reshaped_data[[.x]][i])
    pluck(data_list, !!!keys) <- reshaped_data$value[i]
  }

  all_data[[matrix]]$label <- raw_data$label
  all_data[[matrix]]$updated <- as.Date(raw_data$updated)
  all_data[[matrix]]$subject <- raw_data$extension$subject$code
  all_data[[matrix]]$product <- raw_data$extension$product$code
  all_data[[matrix]]$data <- data_list
}



if (!dir.exists("public")) dir.create("public")
if (!dir.exists("public/data")) dir.create("public/data")
write_json(all_data, "public/data/data.json", pretty = TRUE, auto_unbox = TRUE)