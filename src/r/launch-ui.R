if (!requireNamespace("remotes", quietly = TRUE)) {
  install.packages("remotes")
}

try(
  remotes::install_github(
    "NISRA-Tech-Lab/dashboard-buildr",
    upgrade = "never",
    quiet = TRUE
  ),
  silent = TRUE
)

if (!requireNamespace("dashboardBuildR", quietly = TRUE)) {
  stop(
    paste(
      "Dashboard BuildR is not installed and could not be",
      "downloaded from GitHub. Check your internet connection",
      "and try again."
    )
  )
}

running_in_rstudio <- identical(
  Sys.getenv("RSTUDIO"),
  "1"
)

if (running_in_rstudio) {

  cat(
    "\n\nLaunching NISRA Dashboard BuildR in Browser...\n\n",
    "Press Esc to quit\n"
  )

} else {

  cat(
    "\n\nLaunching NISRA Dashboard BuildR in Browser...\n\n",
    "Press Ctrl + C to quit\n"
  )
}

dashboardBuildR::run_dashboard_buildr()