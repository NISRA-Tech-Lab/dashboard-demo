if (!require(dashboardBuildR)) {
  if (!require(remotes)) install.packages("remotes")
  remotes::install_github("NISRA-Tech-Lab/dashboard-buildr")
}

dashboardBuildR::run_dashboard_buildr()
