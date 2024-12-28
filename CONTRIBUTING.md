# Contributing

## Versioning and releasing

We’re using [Changesets](https://github.com/changesets/changesets) to automate the version and release process of Accented as much as possible.

### Marking a change that requires a version bump

When a code is being written / a pull request is being made, we should ask ourselves whether it may affect the consumers of Accented.
In other words, does this change deserve an entry in the changelog for the upcoming version?

If the above is true, run `pnpm changeset` and follow the interactive prompts.
This will create a file that describes the change and its severity according to [semver](https://semver.org/) (Patch, Minor, or Major).

The library version is **not** bumped at this time.

**Examples of changes requiring changesets:**

* A change in the business logic / UI / API (obviously).
* A bug fix / performance improvement.
* A dependency version bump.
* A development dependency version bump (if it may potentially change the compiled code).
* A Readme update (if that’s the Readme that gets published on NPM).

**Examples of changes that don’t require changesets:**

* A change in testing code.
* A change in the devapp.
* A CI config change.

There’s a bot provided by Changesets that comments on each pull request reminding that a changeset is expected along with the pull request.
Use your best judgment to decide whether it’s actually needed.

### Releasing a new version

This process is mostly automated.

There’s a pull request that’s kept up-to-date by a Changesets Github action,
and a human’s only job is to merge it when the time comes to release the next version.

**The pull request contains the following:**

* An Accented version bump, based on all the changesets on the main branch so far.
* A changelog update, also based on all the changesets.
* The removal of all the changesets (we start clean after a version bump).

**Merging the pull request performs the following actions:**

* Publishing the new version to NPM.
* Creating a tag and a release in Github that duplicates the changelog entry contents.

### Releasing a snapshot version

We may choose to release a snapshot version for testing at any time.
This will **not** change the `latest` distribution tag on NPM,
and the version is `0.0.0-<timestamp>`,
therefore consumers will never install it accidentally.

To create a snapshot version, push a branch whose name starts with `snapshot`.
The CI server publishes a new snapshot release on every push to such a branch.

The version can then be installed by a consumer either by its version number (`accented@0.0.0-<timestamp>`)
or by the `snapshot` tag (`accented@snapshot`).
