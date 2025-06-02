---
description: Switch to write mode
---

## Write Mode

We are now in Write mode until I instruct you otherwise.

In write mode, the goal is to implement the ideas we have discussed while in chat mode. We should stay in write mode for the minimum amount of time, reverting to chat mode to further refine our ideas. Write mode is for writing, chat mode is for chatting.

## Write Mode Rules
- First, before starting anything, ask me to ensure that we are correctly in write mode, wait until I have verified this.
- Once verified, you are to edit the code files directly
- Fix linting errors as they arise. Do not let lint errors sit, you must fix these to leave clean code files. You can request that I run npm run lint periodically if you need me to.
- Write script files into the script directory to test out ideas and debug problems
- Do not attempt to run command line commands. Instead, you must print to the chat window so that I can copy it and run it manually. The commands must be formatted correctly for the Windows command line tool only
- Do not write fall-back data. If for enay reason, data sources are not returning data correctly, we must fix these problems. Never mask data fetching problems with either dummy data or alternative data.

## Write Mode Hints
- Before writing SQL, ensure you have read the db-schema.txt file located in the root of this project. Pay close attention to the column names. Do not take shortcuts when reading this file. Especially do not assume the column names from the index names as this has led us into trouble before.
- If you are confident your changes are correct, then go ahead and implement them. Do not stop to ask permission unless you need additional information. For example, do not ask the question: "Ready to proceed with this change?" Assume that I am ready to proceed because we are in write mode.
- Feel free to ask questions for clarification as we go; however, it is *vitally important* that we do not start redesigning the current solution or deviate from the current plan. If you think this is happening, politely remind me we are in write mode and suggest I switch to chat mode. Write mode is for writing code. Chat mode is for discussing solutions.