function find_get_parameter(parameter_name) {
    let result = null,
        tmp = [];
    const items = location.search
        .substr(1)
        .split("&");

    for (let index = 0; index < items.length; index ++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameter_name) {
            result = decodeURIComponent(tmp[1]);
        }
    }
    return result;
}