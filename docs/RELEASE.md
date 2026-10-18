# Release checklist

Keep this repository **private** until the owner's final publication decision.

Before publication:

- Review every tracked file and reachable commit for credentials and private material.
- Confirm no original engine code, prompts, rubrics, consumer data, configuration,
  compiled bundles or original history is present.
- Run `npm ci`, `npm run check`, `npm audit` and the documented CLI examples.
- Verify the exact candidate/evidence/review binding and non-ready failure scenarios.
- Confirm README limitations, synthetic-data labels, examples, schemas and license.
- Confirm dependencies resolve publicly and retain their own license notices.
- Confirm the original repository remains private and unchanged.
- Obtain the owner's explicit approval before changing GitHub visibility.

The portfolio prepares a human handoff only. It has no provider, publisher or
production integration to enable. Building real orchestration or remote publication
would be a separate scope and review, not a configuration toggle in this example.
