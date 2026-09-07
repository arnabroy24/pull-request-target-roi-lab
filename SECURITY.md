# Security policy

This lab compares a restricted `pull_request` job with the safe, metadata-only
use of `pull_request_target`.

The `pull_request` workflow is allowed to execute the proposed revision, but it
must retain read-only permissions, receive no secrets, and avoid persisted
credentials.

The `pull_request_target` workflow must never check out a pull-request head or
merge ref, execute files supplied by a contributor, restore
contributor-selected caches, download contributor-controlled artifacts, or
receive a long-lived credential.

Please report any change that crosses that boundary. Do not add repository,
organization, environment, cloud, package-registry, or deployment secrets to
this demonstration repository.
