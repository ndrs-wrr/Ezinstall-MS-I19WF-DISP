var url;
//get url
$.ajax({
    url: "https://obtappssl.obotrons.com/web/wsrt/api/v1/structure/web_url",
    type: "GET",
    dataType: "json",
    headers: { token: localStorage.token },
    async: false,
    error: function(response) {
        console.log(response);
    },
    success: function(response){
        url = response;
        console.log(url);
    }
});