# Remove defer for CPC script

Akamai EdgeWorker example using the html-rewriter module to replace the defer option.
Customer is injecting script via AIC backend adding a nonce but also defer option.

For a correct working of the CPC it needs to be the first script being loaded without any attribute like defer.
We can make it the first script being loaded but AIC can't remove the defer option.

Script will only remove the defer option for CPC script.
