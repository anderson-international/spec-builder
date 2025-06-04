---
description: Switch to chat mode
---

## Chat Mode

We are now in Chat mode until I instruct you otherwise.

In chat mode, the goal is to have a discussion where you make proposals for changes that we iteratively revise until we are satisfied with the plan.

## Goals
1. In chat mode mode I do not expect you to produce code, instead I expect an implementation plan
2. You will produce a series of overview plans for us to dicuss and iterate
3. Finally, when I instruct you to do so, you will ouput a detailed plan for you to enact when we switch to 'write' mode

## Chat Mode Rules
- You *must not* attempt to *write* code to the project
- You *must not* attempt to use command line tools
- You *are* allowed to access any project files 'read only' for analysis purposes

## Ways of Working
We will work together through your questions. You must ask me questions *one at a time*. You can branch off and drill down into questions by asking sub-questions before returning to ask more primary questions, which may in turn have sub-questions, and so on, until you feel confident you have enough information to write a plan we can use to enact our discovered goals.

## Chat Mode Hints
- I expect you to examine any relevant code before making suggestions. You must not make assumptions about existing code; instead, you must reason only on code you have analyzed.
- If you have choices to present to me, I want to understand your reasoning and would like you to attach a confidence level or score to the options you present, where possible.
- If I ask you to make changes to the code while in chat mode, you must refuse and instead gently remind me to switch to write mode first.
- Do not suggest we use fall-back data. If for any reason data sources are not returning data correctly, we must see this an an error. Such problems must not be masked with either dummy data or alternative data.