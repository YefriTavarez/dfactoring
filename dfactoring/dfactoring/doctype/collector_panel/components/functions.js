// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

// utils functions
const create = get = $,
	not = value => ! value,
	isset = value => !! value,
	hasvalue = value => !! value,
	isntset = value => ! value,
	isempty = value => ! value.length,
	isntempty = value => !! value.length,
	hasany = value => !! value.length,
	hasnovalue = value => ! value,
	isarray = $.isArray,
	isfunc = $.isFuntion
	;
