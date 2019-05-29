// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

// to import this file, please,
// make sure to import the functions file

function TableBodyCell(parent, content, action) {
	let element = create(`<td></td>`);

	if (
		typeof(content) == "object"
	) {
		get(content.element)
			.appendTo(element);
	} else if (
		typeof(content) == "string" 
		&& content.startsWith("<")
	) {
		get(content)
			.appendTo(element);
	} else if (typeof(content) == "string") {
		element
			.append(content);
	}

	if (isntset(parent)) {
		throw "parent not specified for TableBodyCell"
	}

	if (isntset(content)) {
		throw "content not specified for TableBodyCell"
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
		.appendTo(get(parent.element));
	
	parent.children
		.push(this);

	{
		// remember args

		this.parent = parent;
		this.content = content;
		this.children = [];
		this.action = action;
		this.element = element;
	}

    this.toggle_display = show => {
        let { element } = this;
        
        if (show) {
            element.show();
        } else {
            element.hide();
        }
    };
    
    this.empty = () => {
        let { element } = this;
        
        element.empty();
	}
	
	return this;
}
