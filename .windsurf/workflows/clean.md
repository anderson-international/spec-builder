---
description: Remove code, files, and folders that are not strictly required
---

## Project Minimization Procedure

- Starting at the root project folder, recursively check all the project folders and files, with the exception of the scripts folder, with the goal of removing any code, files, and folders that are not strictly required for the current feature set. 
- Cross-reference all components against the active features.
- Flag and eliminate anything not directly supporting those features, including:
  - Unused functions and classes
  - Duplicate implementations
  - Dead code branches
  - Empty directories
  - Stub files
  - Redundant dependencies
  - Debug or development artifacts
- Maintain core execution paths through call graph analysis to ensure that all essential interprocedural control flows are preserved.
- Ensure the program’s behavior remains unchanged after each removal.