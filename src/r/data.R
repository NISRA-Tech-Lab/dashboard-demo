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

# Ensure output directories exist.
if (!dir.exists("public")) {
  dir.create("public")
}

if (!dir.exists("public/data")) {
  dir.create(
    "public/data",
    recursive = TRUE
  )
}

# Read dashboard configuration.
config_file <- readLines(
  "src/config/config.js",
  warn = FALSE
) %>%
  sub(
    "export ",
    "",
    .
  ) %>%
  paste(
    .,
    collapse = "\n"
  )

ctx <- V8::v8()

ctx$eval(
  config_file
)

config <- ctx$get(
  "config"
)

# Data Portal matrices.
matrix_list <- if (
  !is.null(config$matrix)
) {
  as.character(
    unlist(
      config$matrix,
      use.names = FALSE
    )
  )
} else {
  character()
}

matrix_list <- trimws(
  matrix_list
)

matrix_list <- matrix_list[
  nzchar(matrix_list)
]

# Custom datasets.
#
# Older dashboards may not contain config$custom,
# so treat it as optional.
custom_list <- if (
  !is.null(config$custom)
) {
  as.character(
    unlist(
      config$custom,
      use.names = FALSE
    )
  )
} else {
  character()
}

custom_list <- trimws(
  custom_list
)

custom_list <- custom_list[
  nzchar(custom_list)
]

# Preserve existing custom metadata before rebuilding
# Data Portal metadata.
data_json_path <- file.path(
  "public",
  "data",
  "data.json"
)

custom_entries <- list()

if (
  length(custom_list) > 0 &&
  file.exists(data_json_path)
) {
  
  current_json <- tryCatch(
    {
      jsonlite::read_json(
        data_json_path,
        simplifyVector = FALSE
      )
    },
    error = function(error) {
      
      warning(
        paste(
          "Existing data.json could not be read.",
          "Custom dataset metadata will not be preserved:",
          conditionMessage(error)
        )
      )
      
      list()
    }
  )
  
  available_custom <- intersect(
    custom_list,
    names(current_json)
  )
  
  missing_custom <- setdiff(
    custom_list,
    names(current_json)
  )
  
  if (length(missing_custom) > 0) {
    warning(
      paste0(
        "The following custom datasets are listed in config.js ",
        "but were not found in data.json: ",
        paste(
          missing_custom,
          collapse = ", "
        )
      )
    )
  }
  
  if (length(available_custom) > 0) {
    custom_entries <- current_json[
      available_custom
    ]
  }
}

# API Key ####
api_key <- "801aaca4bcf0030599c019f4efa8b89032e5e6aa1de4a629a7f7e9a86db7fb8c"

# Fetch dataset function ####
fetch_dataset <- function(
    matrix,
    api_key,
    max_attempts = Inf,
    wait_seconds = 2
) {
  
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
        
        json_data <- jsonlite::fromJSON(
          txt = json_url
        )
        
        csv_data <- read.csv(
          csv_url,
          check.names = FALSE
        )
        
        # Check if API itself returned an error field.
        if ("error" %in% names(csv_data)) {
          stop(
            "API returned error field"
          )
        }
        
        return(
          list(
            json = json_data,
            csv = csv_data
          )
        )
      },
      
      error = function(error) {
        
        message(
          sprintf(
            "Error fetching %s (attempt %d): %s",
            matrix,
            attempt,
            error$message
          )
        )
        
        NULL
      }
    )
    
    if (!is.null(result)) {
      return(result)
    }
    
    attempt <- attempt + 1
    
    if (attempt > max_attempts) {
      stop(
        "Max attempts reached without success."
      )
    }
    
    Sys.sleep(
      wait_seconds
    )
  }
}

# Fetch Data Portal data ####
all_data <- list()

for (matrix in matrix_list) {
  
  raw_data <- fetch_dataset(
    matrix,
    api_key
  )
  
  raw_json <- raw_data$json
  
  dimensions <- raw_json$dimension
  
  variables <- map(
    names(dimensions),
    function(var) {
      
      list(
        code = var,
        name = dimensions[[var]]$label,
        values = dimensions[[var]]$category$label
      )
    }
  )
  
  all_data[[matrix]]$label <-
    raw_json$label
  
  all_data[[matrix]]$updated <-
    as.Date(
      raw_json$updated
    )
  
  all_data[[matrix]]$subject <-
    raw_json$extension$subject$code
  
  all_data[[matrix]]$product <-
    raw_json$extension$product$code
  
  all_data[[matrix]]$variables <-
    variables
  
  raw_csv <- raw_data$csv
  
  cols_to_keep <- character()
  
  for (i in seq_along(dimensions)) {
    
    dimension_name <-
      names(dimensions[i])
    
    dimension_label <-
      dimensions[[i]]$label
    
    if (
      tolower(dimension_name) ==
      tolower(dimension_label)
    ) {
      
      cols_to_keep <- c(
        cols_to_keep,
        paste(
          dimension_label,
          "Label"
        )
      )
      
    } else {
      
      cols_to_keep <- c(
        cols_to_keep,
        dimension_label
      )
    }
  }
  
  pivot_col <- tail(
    cols_to_keep,
    1
  )
  
  cols_to_keep <- c(
    cols_to_keep,
    "VALUE"
  )
  
  csv_wide <- raw_csv %>%
    select(
      all_of(
        cols_to_keep
      )
    ) %>%
    pivot_wider(
      names_from = all_of(
        pivot_col
      ),
      values_from = "VALUE"
    )
  
  names(csv_wide) <- gsub(
    " Label",
    "",
    names(csv_wide)
  )
  
  write.csv(
    csv_wide,
    file.path(
      "public",
      "data",
      paste0(
        matrix,
        ".csv"
      )
    ),
    row.names = FALSE
  )
}

# Append preserved custom dataset metadata ####
#
# Custom datasets are never requested from the Data Portal.
# Their CSV files and metadata are managed through Dashboard BuildR.
if (length(custom_entries) > 0) {
  
  all_data <- c(
    all_data,
    custom_entries
  )
}

# Write combined metadata ####
jsonlite::write_json(
  all_data,
  data_json_path,
  pretty = TRUE,
  auto_unbox = TRUE
)