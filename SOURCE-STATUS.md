# Source and distribution status

Koder TUI uses the same Koder-EULA-1.1 agreement as the current Koder CLI distribution. The EULA text is unchanged from [KarmenLoop/koder-cli](https://github.com/KarmenLoop/koder-cli/blob/main/EULA.md). Its SHA-256 is `fa93cf1ce4834f04b899529a8a676ebee18d99725afad9c8d614940ba3351092`.

## Public repository

The current public branch contains product documentation, installation scripts, license notices and release verification. New proprietary development source and internal regression suites are maintained separately. The public artifact checks validate package integrity, bundled versions, CLI routes and isolated installation; the earlier full regression results remain in the release verification record.

Workbench implementation files were included in earlier commits. Those historical commits remain accessible, and copies already downloaded cannot be recalled by removing files from this branch. This change does not assert that the implementation has never been public. Those files were published with Koder-EULA-1.1, not a new GPL, MIT or Apache license grant.

## Runtime packages

Windows x64 and both macOS packages for TUI 0.3.0 include the same EULA and explicitly identify Koder-EULA-1.1 in their version metadata. They contain the readable scripts required to run Koder. Readable runtime files do not grant permission to modify, repackage or redistribute proprietary implementation beyond the EULA's terms and applicable exceptions.

Personal, noncommercial local use is free. Commercial use, internal organizational work and deployment, proprietary implementation changes and redistribution require the permissions described in the EULA. Supported configuration and independently authored extensions remain available within the licensed scope.

## Existing licenses

Historical CLI source and third-party components retain their original licenses. The CLI's legacy GPL boundary belongs to the CLI repository; its old CLI 0.3.0 release is not the independently versioned TUI 0.3.0 release. Nothing here withdraws an existing GPL grant or relicenses third-party work.

Company licensing and dedicated private repository delivery: info@karmenloop.com.
