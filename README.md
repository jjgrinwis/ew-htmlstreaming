# Remove defer for CPC script

Akamai EdgeWorker example using the [html-rewriter](https://techdocs.akamai.com/edgeworkers/docs/htmlrewriter) module to replace the defer option.
Some customer is injecting [CPC](https://www.akamai.com/products/client-side-protection-compliance) script via AIC backend adding a ```nonce``` but also ```defer``` option to ```<script>``` tag.

For a correct working of the CPC, it needs to be the first script being loaded without any attribute like defer.
We can make it the first loaded script, but AIC can't remove the defer option.

EW Script will only remove the defer option for CPC script, that's it.
