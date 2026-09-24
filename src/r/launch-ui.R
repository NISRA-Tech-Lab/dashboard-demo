# Use a fixed CRAN mirror for any dependencies that need to be installed.
options(
  repos = c(
    CRAN = "https://cran.rstudio.com/"
  )
)

# Ensure the remotes and languageserver packages are
# available so Dashboard BuildR can be installed directly from GitHub.
for (pkg in c("remotes", "languageserver")) {
  if (!requireNamespace(pkg, quietly = TRUE))
    install.packages(pkg)
}

# Install Dashboard BuildR from GitHub if required.
# If GitHub is unavailable, continue using the locally installed
# version where possible.
try(
  remotes::install_github(
    "NISRA-Tech-Lab/dashboard-buildr",
    upgrade = "never",
    quiet = TRUE
  ),
  silent = TRUE
)

# Stop if Dashboard BuildR is still unavailable.
if (!requireNamespace("dashboardBuildR", quietly = TRUE)) {
  stop(
    paste(
      "Dashboard BuildR is not installed and could not be",
      "downloaded from GitHub. Check your internet connection",
      "and try again."
    )
  )
}

# Launch Dashboard BuildR.
dashboardBuildR::run_dashboard_buildr()