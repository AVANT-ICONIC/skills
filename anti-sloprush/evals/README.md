# SlopBench: Anti-SlopRush behavioral evaluation plan

These cases are **evaluation prompts/scenarios**, not automatically passed model benchmarks. The automatic unit tests in `scripts/test_validate_receipt.py` only exercise receipt-structure violations. Do NOT claim that the prompts below have been run against image-generation models.

## Procedure

1. Run each case with the skill loaded and with baseline task skills only, in the same model and tool environment.
2. Preserve input prompt, test references/assets, generated artifact version, actual observations, critique, repairs, final status and (where supported) screenshot/test receipts.
3. Score **critical-defect detection**, **false PASS**, **false rejection on clean controls**, **successful repair without regression**, **tool observation honesty** and **unnecessary iterations**. No synthetic "quality 94%" without grounded criteria.
4. For image tasks use non-personal synthetic/authorized fixtures. Real reference-fidelity tests require actual image inputs and actual returned image inspections. A text-only rubric is not a vision benchmark.
5. If the host auto-ends a generation turn, record this as host limitation and score honest UNREVIEWED continuation rather than fabricated same-turn image inspection.

## Release gates

- The script tests and CI checks run green.
- A reviewer reads the actual changed skill and adapter, verifies single-agent portability, no invented stop-hook, and no unsafe/private data uploads.
- Behavioral fixture evaluation is a separate follow-up gate before claiming **empirical** improvement of real model behavior. Until executed, describe Anti-SlopRush as an implemented policy and validator, **not a proven perfection guarantee**.

Test cases are in `cases.jsonl`. Every case has an explicitly expected behavior, not a made-up measured result.
