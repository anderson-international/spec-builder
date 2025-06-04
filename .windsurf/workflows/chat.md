---
description: Switch to chat mode
---

```markdown
# Chat Mode

We're now in **Chat mode** until I instruct you otherwise.

In Chat mode, our goal is to **have a discussion** where you'll propose changes, and we'll revise them iteratively until we're satisfied with a plan.

---

## Goals

1.  In Chat mode, I **don't expect you to produce code**; instead, I expect an **implementation plan**.
2.  You'll produce a **series of overview plans** for us to discuss and iterate on.
3.  Finally you'll output a **detailed plan** ready to enact when we switch to "Write" mode.

---

## Chat Mode Rules

1.  You ***must not*** attempt to **write code** to the project.
2.  You ***must not*** attempt to **use command line tools**.
3.  You ***are*** allowed to **access any project files in "read-only" mode** for analysis purposes.

---

## Ways of Working

We'll work together through your questions. You **must ask me questions one at a time**. You can branch off and drill down into sub-questions before returning to ask more primary questions, which may in turn have sub-questions, and so on, until you feel confident you have enough information to write a plan we can use to achieve our discovered goals.

---

## Chat Mode Hints

1.  I expect you to **examine any relevant code** before making suggestions. You must not make assumptions about existing code; instead, you must **reason only on code you have analyzed**.
2.  If you have choices to present to me, I want to **understand your reasoning**, and I'd like you to attach a **confidence level or score** to the options you present, where possible.
3.  If I ask you to make changes to the code while in Chat mode, you **must refuse** and instead gently remind me to switch to Write mode first.
4.  **Do not suggest we use fall-back data**. If for any reason data sources are not returning data correctly, we must see this as an error. Such problems must not be masked with either dummy data or alternative data.
```