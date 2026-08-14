# Ensure the remotes package is available so Dashboard BuildR
# can be installed directly from GitHub.
if (!requireNamespace("remotes", quietly = TRUE)) {
  install.packages("remotes")
}

# Check GitHub for the current Dashboard BuildR version.
#
# remotes::install_github() will normally avoid reinstalling
# when the installed GitHub commit is already current.
#
# upgrade = "never" prevents unrelated package dependencies
# from being upgraded automatically.
#
# try(..., silent = TRUE) allows the script to continue if
# GitHub is temporarily unavailable, provided Dashboard BuildR
# is already installed locally.
try(
  remotes::install_github(
    "NISRA-Tech-Lab/dashboard-buildr",
    upgrade = "never",
    quiet = TRUE
  ),
  silent = TRUE
)

# Stop with a clear message if Dashboard BuildR is still
# unavailable after the installation/update attempt.
if (!requireNamespace("dashboardBuildR", quietly = TRUE)) {
  stop(
    paste(
      "Dashboard BuildR is not installed and could not be",
      "downloaded from GitHub. Check your internet connection",
      "and try again."
    )
  )
}

# Detect whether the script is being run inside RStudio.
# This is only used to show the appropriate quit instruction.
running_in_rstudio <- identical(
  Sys.getenv("RSTUDIO"),
  "1"
)

# Display a short launch message with the appropriate method
# for stopping the Shiny application.
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

# Launch Dashboard BuildR.
dashboardBuildR::run_dashboard_buildr()