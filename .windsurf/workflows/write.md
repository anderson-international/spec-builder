---
description: Switch to write mode
---

## Write Mode

We are now in Write mode until I instruct you otherwise.

In write mode, the goal is to implement the ideas we have discussed while in chat mode. We should stay in write mode for the minimum amount of time, reverting to chat mode to further refine our ideas. Write mode is for writing, chat mode is for chatting.

## Write Mode Rules
- First, before starting anything, ask me to ensure that we are correctly in write mode, wait until I have verified this.
- Once verified, you are to edit the code files directly
- Fix linting errors as they ar```markdown
# Write Mode

We're now in **Write mode** until I instruct you otherwise.

In Write mode, our goal is to **implement the ideas** we've discussed in Chat mode. We should stay in Write mode for the minimum amount of time, reverting to Chat mode to further refine our ideas. Think of it this way: Write mode is for writing code, and Chat mode is for chatting about it.

---

## Write Mode Rules

1.  Before you do anything, please **confirm that we are correctly in Write mode** and wait for my verification.
2.  Once verified, you'll **edit the code files directly**.
3.  **Fix any linting errors immediately**. Don't let them accumulate; clean code files are essential. You can ask me to run `npm run lint` periodically if you need.
4.  **Write script files** in the `script` directory to test ideas and debug problems.
5.  **Do not attempt to run command line commands yourself**. Instead, print the command to the chat window, formatted correctly for the **Windows command line**, so I can copy and run it manually.
6.  **Never write fall-back data**. If data sources aren't returning data correctly, we must fix those issues directly. We should never mask data fetching problems with dummy or alternative data.

---

## Write Mode Hints

1.  Before writing any SQL, **always read the `db-schema.txt` file** in the project root. Pay close attention to column names and **do not make assumptions** from index names; this has caused problems before.
2.  If you're confident in your changes, **implement them directly**. Don't stop to ask for permission unless you genuinely need more information. For example, avoid questions like "Ready to proceed with this change?" Assume I'm ready because we're in Write mode.
3.  Feel free to **ask clarifying questions** as we go. However, it's *critically important* that we **do not start redesigning the current solution or deviate from the plan**. If you think this is happening, politely remind me we're in Write mode and suggest we switch to Chat mode. Remember: Write mode is for writing code, Chat mode is for discussing solutions.

---

# Implementation Boundaries Rule

When implementing a feature:

1.  **Strictly adhere to the scope** defined during the planning phase.
2.  **Prioritize functionality over UI enhancements** unless explicitly requested.
3.  **Avoid adding user-facing controls or displays** that weren't specified in the requirements.
4.  If you're unsure about including a feature, **ask for explicit confirmation**.
5.  **Focus on robust implementation of core functionality** before considering extensions.
6.  Always **explain your approach step-by-step** before writing any code.
```ise. Do not let lint errors sit, you must fix these to leave clean code files. You can request that I run npm run lint periodically if you need me to.
- Write script files into the script directory to test out ideas and debug problems
- Do not attempt to run command line commands. Instead, you must print to the chat window so that I can copy it and run it manually. The commands must be formatted correctly for the Windows command line tool only
- Do not write fall-back data. If for enay reason, data sources are not returning data correctly, we must fix these problems. Never mask data fetching problems with either dummy data or alternative data.

## Write Mode Hints
- Before writing SQL, ensure you have read the db-schema.txt file located in the root of this project. Pay close attention to the column names. Do not take shortcuts when reading this file. Especially do not assume the column names from the index names as this has led us into trouble before.
- If you are confident your changes are correct, then go ahead and implement them. Do not stop to ask permission unless you need additional information. For example, do not ask the question: "Ready to proceed with this change?" Assume that I am ready to proceed because we are in write mode.
- Feel free to ask questions for clarification as we go; however, it is *vitally important* that we do not start redesigning the current solution or deviate from the current plan. If you think this is happening, politely remind me we are in write mode and suggest I switch to chat mode. Write mode is for writing code. Chat mode is for discussing solutions.

# Implementation Boundaries Rule

When implementing a feature:

1. Strictly adhere to the scope defined in the planning phase
2. Prioritize functionality over UI enhancements unless explicitly requested
3. Avoid adding user-facing controls or displays not specified in requirements
4. When in doubt about a feature's inclusion, ask for explicit confirmation
5. Focus on robust implementation of core functionality before considering extensions
6. Explain your approach step-by-step before writing any code.