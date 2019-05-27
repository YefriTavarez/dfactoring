// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

// to import this file, please,
// make sure to import the functions file

function AnchorTag(parent, href, label, action) {
	let element = create(`<a href="${href}">
		${label}</a>`);

	if (isntset(parent)) {
		throw "parent not specified for AnchorTag"
	}

	if (isntset(href)) {
		throw "href not specified for AnchorTag"
	}

	if (isntset(label)) {
		label = href;
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
		this.href = href;
		this.label = label;
		this.action = action;
		this.element = element;
	}

	return this;
}

/* USAGE */
//
// anchor = new AnchorTag(get("div[data-fieldname=record]"), "/desk", "Go Home", event => {
// 	// pass
// });
