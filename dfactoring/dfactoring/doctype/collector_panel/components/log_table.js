// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

// to import this file, please,
// make sure to import the functions file

function LogTable(parent, action) {
	let element = create(`
		<table class="table table-hover"></table>
	`);

	if (isntset(parent)) {
		throw "parent not specified for LogTable"
	}

	if (action) {
		element
			.on("click", event => {
				// prevent the default
				// behaviour as the user
				// wants to do something else
				event.preventDefault();

				if ($.isFunction(action)) {
					action(event);
				}
			});
	}

	// finally append to the parent
	// to do the display
	element
		.appendTo(get(parent));

	{
		// remember args

		this.parent = parent;
		this.action = action;
		this.element = element;
	}

	return this;
}
