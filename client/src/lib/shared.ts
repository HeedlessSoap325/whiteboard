export function getErrors(data: any) {
	let ret = data["errors"].reduce((acc: string, el: {[s: string]: string, msg: string}) => {
		acc += "<span class='errorMSG'>";
		acc += el["msg"];
		acc += "</span>";
		acc += "<br/>"
		return acc;
	}, "<div class='hint'>");

	ret = ret.slice(0, -5);
	ret += "</div>";

	return ret;
}