# Checkpoint Command

Save current state before risky operations.

## Instructions

1. Create git commit with current changes:
   ```bash
   git add -A
   git commit -m "CHECKPOINT: [description]"
   ```

2. Update `.claude-session.md` with:
   - Current task status
   - Any decisions made
   - Files modified

3. Check context usage with `/usage`

4. If context > 70%, run `/compact` after saving summary

5. Report:
   ```
   CHECKPOINT CREATED

   Commit: [hash]
   Context: [X]% used
   Session file: Updated

   Safe to proceed with risky operation.
   ```
