$( document ).ready(function() {

	var states = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.whitespace,
		queryTokenizer: Bloodhound.tokenizers.whitespace,				

		local: items
	});

	$('#bloodhound .typeahead').typeahead(
		{
			hint: true,
			highlight: true,
			minLength: 1
		},
		{
			name: 'states',
			source: states
		}
	);
});