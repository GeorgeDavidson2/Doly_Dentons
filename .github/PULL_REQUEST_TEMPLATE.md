## Closes

Closes #<!-- issue number -->

---

## Type of Change

- [ ] Feature (new functionality)
- [ ] Bug fix
- [ ] Refactor (no behaviour change)
- [ ] Seed data / migration
- [ ] Config / tooling

---

## Summary

<!-- What was built? What decisions were made and why? Keep it to 2–3 sentences. -->

---

## How to Test

<!-- Step-by-step instructions for the reviewer to verify this works locally. -->

1. 
2. 
3. 

---

## Demo Impact

<!-- Does this PR touch the Marcus demo path? (matter creation → Context → Connect → Flow → Reputation) -->

- [ ] Yes — describe what changes in the demo:
- [ ] No

---

## Pre-Merge Checklist

- [ ] Linked issue number filled in above
- [ ] New environment variables added to `.env.example` and documented in README
- [ ] No `console.log` left in production code
- [ ] Supabase RLS policies still enforce correctly
- [ ] If DB schema changed — migration file created and `embed-lawyers` script re-run if `lawyers` table affected
- [ ] Groq prompts tested against rate limit edge case (cached/error state handled)
- [ ] Tested locally with `npm run dev`

---

## Screenshots

<!-- For UI changes only. Before / after if relevant. Delete this section if not applicable. -->
