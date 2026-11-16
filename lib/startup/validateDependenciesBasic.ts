const validateIfDependencyCheckerIsInstalled = async () => {
  try {
    await import('semver')
  } catch (err) {
    console.error('Please run "npm install" before starting the application!')
    process.exit(1)
  }
}

export default validateIfDependencyCheckerIsInstalled
