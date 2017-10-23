---
---

$(document).ready(function() {


	var levDist = function(s, t) {
		var d = []; //2d matrix

		// Step 1
		var n = s.length;
		var m = t.length;

		if (n == 0) return m;
		if (m == 0) return n;

		//Create an array of arrays in javascript (a descending loop is quicker)
		for (var i = n; i >= 0; i--) d[i] = [];

		// Step 2
		for (var i = n; i >= 0; i--) d[i][0] = i;
		for (var j = m; j >= 0; j--) d[0][j] = j;

		// Step 3
		for (var i = 1; i <= n; i++) {
			var s_i = s.charAt(i - 1);

			// Step 4
			for (var j = 1; j <= m; j++) {

				//Check the jagged ld total so far
				if (i == j && d[i][j] > 4) return n;

				var t_j = t.charAt(j - 1);
				var cost = (s_i == t_j) ? 0 : 1; // Step 5

				//Calculate the minimum
				var mi = d[i - 1][j] + 1;
				var b = d[i][j - 1] + 1;
				var c = d[i - 1][j - 1] + cost;

				if (b < mi) mi = b;
				if (c < mi) mi = c;

				d[i][j] = mi; // Step 6

				//Damerau transposition
				if (i > 1 && j > 1 && s_i == t.charAt(j - 2) && s.charAt(i - 2) == t_j) {
					d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
				}
			}
		}

		// Step 7
		return d[n][m];
	}

	var substringMatcher = function(strs) {
		return function findMatches(q, cb) {
			var matches, substringRegex;

			// an array that will be populated with substring matches
			matches = [];

			// regex used to determine if a string contains the substring `q`
			substrRegex = new RegExp(q.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'i');

			// iterate through the pool of strings and for any string that
			// contains the substring `q`, add it to the `matches` array
			$.each(strs, function(i, str) {
				if (substrRegex.test(str)) {
					matches.push(str);
				}
			});

			matches = matches.sort(function(a, b) {
				return levDist(a, q) - levDist(b, q);
			});


			// For demonstration:
			//for (var i = 0; i < matches.length; i++) {
			//	matches[i] = matches[i] + "(" + levDist(matches[i], q) + ")";
			//}

			cb(matches);
		};
	};



	// Load the quick-nav from a json data file and prepend special char
	var quickNav={{ site.data.search_quicknav | jsonify }};
	window.quickNav=[];
	for(var key in quickNav){
		var newKey = '» '+key;
		//console.log(newKey + " is "+quickNav[key] );
		window.quickNav[newKey]=quickNav[key];
	}

	// Typeahead should be search capabilities
	var typeaheadData = [
		'id:',
		'title:',
		'author:',
		'category:',
		'content:',
	];

	// ...plus quicknav items
	for (var key in window.quickNav) {
	   	typeaheadData.push(key)
	}


	$('#largeSearch').typeahead({
		hint: true,
		highlight: true,
		minLength: 1
	}, {
		name: 'typeaheadData',
		source: substringMatcher(typeaheadData)
	});


	// When the typeahead enter is hit, submit the form
	$('input.typeahead').bind("typeahead:selected", function () {
           $("form").submit();
	});



	// Intercept form submission
	window.formValidator = function(){

		// If we find the special char, then we navigate, otherwise submit form
		var searchTerm = document.forms["largeSearch"]["query"].value;
		if(searchTerm.indexOf('»') !== -1){
			destination=window.quickNav[searchTerm];
			console.log("Navigate to: "+ searchTerm + destination);
			document.location=destination;
			return false;
		}

		return true;
	}

});
