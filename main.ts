/*
(c) Copyright 2024 Akamai Technologies, Inc. Licensed under Apache 2 license.
Purpose: remove the defer option from our CPC injection script.
*/
import { HtmlRewritingStream } from 'html-rewriter';
import { ReadableStream } from 'streams';
import { createResponse } from 'create-response';
import { httpRequest } from 'http-request';

/*
some 'unsave' response headers we need to remove. createResponse() will fail if not removed
https://techdocs.akamai.com/edgeworkers/docs/create-response

There is also some issue with request headers. Removing some connection based headers as call will fail.
*/
const responseHeadersToRemove = ['host','content-length', 'transfer-encoding', 'connection', 'vary', 'keep-alive','Proxy-Authenticate', 'proxy-authorization', 'te', 'trailers', 'upgrade'];
const requestHeadersToRemove = ['host', 'connection', 'upgrade'];
            
export async function responseProvider(request: EW.ResponseProviderRequest) {

    /*
    fire off our request to the original origin, if something goes wrong, generate 500 with request url.
    Origin should be behind Akamai: https://techdocs.akamai.com/edgeworkers/docs/http-request#http-sub-requests
    */
    let htmlResponse = await originRequest(request, request.body)
    if (!htmlResponse.ok) {
        return createResponse(500, {}, `EW Failed to fetch doc from ${request.scheme}://${request.host}${request.url} : ${htmlResponse.status}`);
    }
 
    const rewriter = new HtmlRewritingStream();

    /*
    Removing the defer attribute using CSS selector for any script src in the head that starts with URL of CPC source
    https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Selectors

    We're going to pipe a readable stream of data through this rewriter object.
    */
    rewriter.onElement('head script[src^="https://p11.techlab-cdn.com"]', el => {
        el.removeAttribute('defer')
    });
 
    /*
    Use pipeThrough() to modify the input HTML with the rewriter.
    Make sure to remove some headers.
    https://techdocs.akamai.com/edgeworkers/docs/create-response
    */
    let responseHeaders = htmlResponse.getHeaders()
    responseHeadersToRemove.forEach(element => delete responseHeaders[element])

    return createResponse(200, responseHeaders, htmlResponse.body.pipeThrough(rewriter));
}

async function originRequest(request: EW.ResponseProviderRequest, originStream: ReadableStream) {
    /*
    using async as we are using await in the function body. Await expressions make promise-returning functions behave as though they're synchronous 
    by suspending execution until the returned promise is fulfilled or rejected.
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

    Just forward the request to origin with the origin url.
    We need to cleanup our request header as not all headers are allowed
    https://techdocs.akamai.com/edgeworkers/docs/http-request#http-sub-requests
    */
    let requestHeaders = request.getHeaders()
    requestHeadersToRemove.forEach(element => delete requestHeaders[element])
    
    let originResponse = await httpRequest(`${request.scheme}://${request.host}${request.url}`, {method: request.method, headers: requestHeaders, body: originStream})
   
    return originResponse
}