// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

// to import this file, please,
// make sure to import the functions file

function TableWrapper(parent, action) {
	let element = create(`
		<div class="">
			<h2>${__("Today's Pendings")}</h2>
		</div>
	`);

	if (isntset(parent)) {
		throw "parent not specified for TableWrapper"
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
		this.action = action;
		this.children = [];
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
