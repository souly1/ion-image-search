# ion-image-search

An Ionic service for searching an image from the web with an endless scroll, similar to Whatsapps `Search web` feature when defining image for group.

# Demo:

Will add a plunker in the future

Demo can be seen in app:

[Fitness Meal Planner](http://www.fitnessmealplanner.com)

## Requirements

- Ionic 1.*

## ScreenShots

![alt tag](/screenshots/screenshot1.jpg)

## Usage

- You can either add the basic CSS and JS to the project and then each provider separately:

```html
<link rel="stylesheet" href="wherever-you-put-it/ionImageSearch.css">

<script type="text/javascript" src="wherever-you-put-it/searchProviders/*Provider.js"></script>
<script type="text/javascript" src="wherever-you-put-it/ionImageSearch.js"></script>
```

Or just add the minified version:

```html
<link rel="stylesheet" href="wherever-you-put-it/ionImageSearch.min.css">

<script type="text/javascript" src="wherever-you-put-it/ionImageSearch.min.js"></script>
```

- Add the configuration file required by providers and ionImageSearch:

```html
<script src="wherever-you-put-it/ionImageSearch.config.js"></script>
```

- Add dependencies on the `ion-image-search` AngularJS module:

```javascript
angular.module('myApp', ['ion-image-search']);
```

Inject $webImageSelector and call `show` to display the modal view:
```javascript
$webImageSelector.show(configuration);
```

The `show` method receives one optional parameter

## Configuration Attributes

The configuration attributes and default values can be found in the `ionImageSearch.config.js` file

- `maxSuccessiveFails` - Maximum number of seccesive search fails till infinite scroll stops or moving to next service provider if array supplied (see below). default is `5`
- `imgSize` - the size of image we want. Default is `small`
- `fileType` - the image file extension. Default is `jpg`
- `searchProviders` - An array that Specifies search providers to use.
                                If more than one is supplied to the array than loads from each service provider in order if service provider failed succesively the configuration value of `maxSuccessiveFails` number of times.
                                Default out of the box is set to use `Google, Bing, Flickr` in that order

## Extending the provider list

You're more than invited to extend the image provider list and even request a merge to inlarge our list of image providers with API.
It is recommended the provider will conform to the existing providers structure, but it is mandatory that it will have at least the following structure:

```javascript

* Constructor that will receive configuration explained above
* `query(searchText, startIndex)` - an async query method to be called to do the actual query which receives two parameters:
    * searchText - the text to actually do the search with
    * startIndex - the starting index for this search
* `getPageSize()` - a method which returns the number of items the query retrieves


```

## Notes

Don't forget to enter your own keys to the different search providers. you can request them at the following locations:

_Google_ -

_Bing_ -

_Flickr_ -

## Testing

TBD. Currently only manually

## License

As AngularJS itself, this module is released under the permissive [MIT license](http://revolunet.mit-license.org). Your contributions are always welcome.

