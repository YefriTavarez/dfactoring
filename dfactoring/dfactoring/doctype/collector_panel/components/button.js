// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

// to import this file, please,
// make sure to import the functions file

function Button(parent, label, action, cssclass) {
	if (!cssclass) {
		cssclass = "btn btn-primary btn-sm"
	}

	let element = create(`<button class="${cssclass}" type="button">
		${label}</button>`);

	if (isntset(parent)) {
		throw "parent not specified for Button"
	}

	if (isntset(label)) {
		throw "label not specified for Button"
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
		this.cssclass = cssclass;
		this.label = label;
		this.action = action;
		this.element = element;
	}

	return this;
}

/* USAGE */
//
// anchor = new Button(get("div[data-fieldname=record]"), __("Click Me"), event => {
// 	// pass
// });
