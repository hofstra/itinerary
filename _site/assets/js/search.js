// search.js
// Search handler for lunr search (http://lunrjs.com)
//////////////////////////////////////////////////////

// After DOM is loaded
document.addEventListener('DOMContentLoaded', function() {

	// Parse keyword from GET vars
	var searchTerm = getQueryVariable('query');
	if (!searchTerm) {
		displayFailureMessage('');
	}else{

		// Set the search boxes on the page to have the searchterm
		/*
		var testElements = document.getElementsByClassName('searchTerm');
		for (var i = 0; i < testElements.length; i++) {
			testElements.item(i).setAttribute("value", searchTerm);
		}
		*/
		document.getElementById('largeSearch').setAttribute("value", searchTerm);

		// Initalize lunr with the fields it will be searching on.
		var idx = lunr(function() {
			this.field('id');
			this.field('title');
			this.field('author');
			this.field('category');
			this.field('content');

			// Build index
			for (var key in window.store) {
				this.add({
					'id': key,
					'title': window.store[key].title,
					'author': window.store[key].author,
					'category': window.store[key].category,
					'content': window.store[key].content
				});
			}
		});

		// Run the search
		for (var key in window.store) {
			//NOTE: Any boost should go here, IE idx.search('title:foo^10')
			try {
    			var results = idx.search(searchTerm);

			// Search supports things like category: title:
			}catch(error) {
				displayFailureMessage(error.message);
				return;
			}

			displaySearchResults(results, window.store);
		}


	}





	// Display the search results on the page
	function displaySearchResults(results, store) {
		var searchResults = document.getElementById('search-results');
		if (results.length) { // Are there any results?
			var appendString = '';

			for (var i = 0; i < results.length; i++) { // Iterate over the results
				var item = store[results[i].ref];
				appendString += '<h3><a href=".' + item.url + '">' + item.title + ' <div class="fa fa-arrow-right" aria-hidden="true"></div></a></h3>';
				appendString += '<p>' + item.content.substring(0, 150) + '...</p></li>';
			}
			searchResults.innerHTML = appendString;
		} else {
			displayFailureMessage('No results found for "' + searchTerm);
		}


	}


	// Inject a failure message onto the screen (into #search-results)
	function displayFailureMessage(message){
		var searchResults = document.getElementById('search-results');
		if(searchResults == null){return;}
		if($.trim(message) == ''){
			searchResults.innerHTML = '';
		}else{
			searchResults.innerHTML = '<div class="searchMsgWrapper"><div class="searchMsg">'+message+'</div></div>';
		}
	}


	// Helper: Parse GET vars
	function getQueryVariable(variable) {
		var query = window.location.search.substring(1);
		var vars = query.split('&');
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');
			if (pair[0] === variable) {
				return decodeURIComponent(pair[1].replace(/\+/g, '%20'));
			}
		}
	}

}, false);
