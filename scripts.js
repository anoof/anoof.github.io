var enableResumedownload = () => {
	var url = "/assets/Resume.pdf";
	var link = document.getElementById("welcome-section_resume");
	link.onclick = () => {
		window.open(url, "_blank");
	};
};

window.onload = function () {
	enableResumedownload();
};
