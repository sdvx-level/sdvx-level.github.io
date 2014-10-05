var imageSize = 128;
var borderSize = 6;
var scoreTypeFontSize = 24;

var pressTimer;

// LZW-compress a string
function lzwEncode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var curr_char;
    var phrase = data[0];
    var code = 256;
    var i;
    for (i = 1; i < data.length; i++) {
        curr_char = data[i];
        if (dict[phrase + curr_char] != null) {
            phrase += curr_char;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + curr_char] = code;
            code++;
            phrase = curr_char;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (i = 0; i < out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// Decompress an LZW-encoded string
function lzwDecode(s) {
    var dict = {};
    var data = (s + "").split("");
    var curr_char = data[0];
    var old_phrase = curr_char;
    var out = [curr_char];
    var code = 256;
    var phrase;
    for (var i = 1; i < data.length; i++) {
        var curr_code = data[i].charCodeAt(0);
        if (curr_code < 256) {
            phrase = data[i];
        }
        else {
            phrase = dict[curr_code] ? dict[curr_code] : (old_phrase + curr_char);
        }
        out.push(phrase);
        curr_char = phrase.charAt(0);
        dict[code] = old_phrase + curr_char;
        code++;
        old_phrase = phrase;
    }
    return out.join("");
}

/**********************************************************
 * Local Storage functions START
 **********************************************************/
function getLocalStorage(key, index) {
    var result = "";
    try {
        result = JSON.parse(localStorage.getItem("rec"))[key][index];
    } catch (err) {
        return "";
    }
    return result;
}

function setLocalStorage(key, index, value) {
    var original_value = JSON.parse(localStorage.getItem("rec")) || {};
    if (original_value[key] == undefined) original_value[key] = [];
    original_value[key][index] = value;
    localStorage.setItem("rec", JSON.stringify(original_value));
}

song_clear_list = ["", "song_clear_c", "song_clear_hc", "song_clear_uc", "song_clear_puc"];
song_type_list = ["", "B", "A", "AA", "AAA"];

function clearClassToValue(elem) {
    for (var i = 1; i < song_clear_list.length; i++) {
        if (elem.hasClass(song_clear_list[i])) return i;
    }
    return 0;
}

function typeLayerToValue(canvas) {
    for (var i = 0; i < song_type_list.length; i++) {
        if (canvas.getLayer('clear_style').text == song_type_list[i]) return i;
    }
    return 0;
}

function setClearByValue(elem, clear_type) {
    for (var i = 1; i < song_clear_list.length; i++) {
        elem.removeClass(song_clear_list[i]);
    }
    if (clear_type == 0) {
        elem.find("canvas").setLayer("song_img", { opacity: 0.2 }).drawLayers();
    } else {
        elem.find("canvas").setLayer("song_img", { opacity: 1 }).drawLayers();
        elem.addClass(song_clear_list[clear_type]);
    }
}

function setTypeByValue(canvas, score_type) {
    var visible = (score_type != 0);
    canvas.setLayer('clear_style', {
        visible: visible,
        text: song_type_list[score_type]
    });
}

function saveToLocalStorage() {
    var dict = {};
    $(".elem").each(function() {
        var id = $(this).data("music-id");
        var value = [];
        value[0] = clearClassToValue($(this)).toString();
        value[1] = typeLayerToValue($(this).find("canvas")).toString();
        dict[id] = value;
    });
    localStorage.setItem("rec", JSON.stringify(dict));
}

function loadFromLocalStorage() {
    var dict = JSON.parse(localStorage.getItem("rec"));
    $(".elem").each(function() {
        var id = $(this).data("music-id");
        setClearByValue($(this), dict[id][0]);
        setTypeByValue($(this).find("canvas"), dict[id][1]);
    });
}

function clearAll() {
    $(".elem").each(function () {
        $(this).removeClass("song_clear_c");
        $(this).removeClass("song_clear_hc");
        $(this).removeClass("song_clear_uc");
        $(this).removeClass("song_clear_puc");
        $(this).find("canvas").setLayer("clear_style", {
            visible: false,
            text: ""
        });
        $(this).find("canvas").setLayer("song_img", { opacity: 0.2 }).drawLayers();
    });
    localStorage.clear();
    resetLocalStorage();
    updateLink();
}

function resetLocalStorage() {
    var dict = {};
    var db_result = music_db().order("id asec");
    db_result.each(function (entry) {
        dict[entry.id] = ["0", "0"];
    });
    localStorage.setItem("rec", JSON.stringify(dict));
}

/**********************************************************
 * Link functions
 **********************************************************/
function updateLink() {
    var text = "?rec=";
    /*
    for (var i = 0; i < localStorage.length; ++i) {
        text += getLocalStorage(localStorage.key(i), 0) + "," + getLocalStorage(localStorage.key(i), 1) + "|";
    }
    text = text.substring(0, text.length - 1);
    text = $.url().attr("host") + $.url().attr("path") + text;
    */
    var dict = {};
    $(".elem").each(function () {
        var id = $(this).data("music-id");
        var value = [];
        value[0] = clearClassToValue($(this)).toString();
        value[1] = typeLayerToValue($(this).find("canvas")).toString();
        dict[id] = value;
    });
    text += lzwEncode(JSON.stringify(dict));
    text = $.url().attr("host") + $.url().attr("path") + text;
    $("#link").val(text);
}

/**********************************************************
 * Utilities
 **********************************************************/
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**********************************************************
 * Element generation functions
 **********************************************************/
function appendSongsByDbResult(db_result, div_dom, header_text) {
    // append new row
    div_dom.append("<div class='score_div score_div_no_bottom'><div class='left_div'></div><div class='right_div'></div></div>");
    // set score text
    div_dom.find(".left_div").last().text(header_text);

    var div_right_dom = div_dom.find(".right_div").last();
    db_result.each(function (entry) {
        // append new div and song
        div_right_dom.append("<div class='elem' data-music-id='" + entry.id + "'></div>");
        var elem_dom = div_right_dom.find("div").last();
        var key = entry.id;

        // red localStorage & set opacity
        var opacity = 1;
        var clear_text = "";
        var clear_visible = false;
        switch (getLocalStorage(key, 0)) {
            case "0":
                opacity = 0.2;
                break;
            case "1":
                opacity = 1;
                elem_dom.addClass("song_clear_c");
                break;
            case "2":
                opacity = 1;
                elem_dom.addClass("song_clear_hc");
                break;
            case "3":
                opacity = 1;
                elem_dom.addClass("song_clear_uc");
                break;
            case "4":
                opacity = 1;
                elem_dom.addClass("song_clear_puc");
                break;
        }
        switch (getLocalStorage(key, 1)) {
            case "0":
                clear_text = "";
                clear_visible = false;
                break;
            case "1":
                clear_text = "B";
                clear_visible = true;
                break;
            case "2":
                clear_text = "A";
                clear_visible = true;
                break;
            case "3":
                clear_text = "AA";
                clear_visible = true;
                break;
            case "4":
                clear_text = "AAA";
                clear_visible = true;
                break;
        }

        elem_dom.append("<canvas class='song_img' height='" + (imageSize + borderSize * 2) + "' width='" + (imageSize + borderSize * 2) + "'> </canvas>");
        var canvas_dom = elem_dom.find("canvas").last();

        var image_obj = new Image();
        var is_mobile = isMobile();
        image_obj.onload = function () {
            if (is_mobile) {
                canvas_dom.drawImage({
                    source: image_obj,
                    opacity: 1,
                    x: borderSize,
                    y: borderSize,
                    width: imageSize,
                    height: imageSize,
                    fromCenter: false,
                    layer: true,
                    name: 'song_img',

                    click: function (layer) {
                        // set up overlap div text
                        var title_name = entry.title;
                        if (entry.type == 3)
                            title_name += " [EXH]";
                        else if (entry.type == 4)
                            title_name += " [INF]";
                        var info_text = "<img src=\"" + "img/" + entry.value + " " + entry.type + ".png" + "\" /><br />";
                        info_text += title_name + "<br />";
                        info_text += "短鍵: " + entry.short_btn + "<br />";
                        info_text += "長短混合: " + entry.short_long_mix + "<br />";
                        info_text += "旋鈕: " + entry.analog + "<br />";
                        info_text += "腦力訓練: " + entry.brain_train + "<br />";
                        info_text += "節奏: " + entry.rythm + "<br />";
                        info_text += "演出陷阱: " + entry.trap + "<br />";
                        $("#song_info_text").html(info_text);
                        // show up overlap div
                        $('#song_info_popup').popup('show');
                    }
                });
            } else {
                canvas_dom.drawImage({
                    source: image_obj,
                    opacity: opacity,
                    x: borderSize,
                    y: borderSize,
                    width: imageSize,
                    height: imageSize,
                    fromCenter: false,
                    layer: true,
                    name: 'song_img',

                    mousemove: is_mobile ? null : function (layer) {
                        var title_name = entry.title;
                        if (entry.type == 3)
                            title_name += " [EXH]";
                        else if (entry.type == 4)
                            title_name += " [INF]";
                        $(this).setLayer('song_info', {
                            visible: true,
                            text: title_name + "\n短　　鍵: " + entry.short_btn + "\n長短混合: " + entry.short_long_mix + "\n旋　　鈕: " + entry.analog + "\n腦力訓練: " + entry.brain_train + "\n節　　奏: " + entry.rythm + "\n演出陷阱: " + entry.trap
                        });
                    },
                    mouseout: function (layer) {
                        if (is_mobile == false) {
                            $(this).setLayer('song_info', {
                                visible: false
                            });
                        }
                        clearTimeout(pressTimer);
                    },

                    mousedown: function (layer) {
                        pressTimer = setTimeout(function () {
                            // set up overlap div text
                            var title_name = entry.title;
                            if (entry.type == 3)
                                title_name += " [EXH]";
                            else if (entry.type == 4)
                                title_name += " [INF]";
                            var info_text = "<img src=\"" + "img/" + entry.value + " " + entry.type + ".png" + "\" /><br />";
                            info_text += title_name + "<br />";
                            info_text += "短鍵: " + entry.short_btn + "<br />";
                            info_text += "長短混合: " + entry.short_long_mix + "<br />";
                            info_text += "旋鈕: " + entry.analog + "<br />";
                            info_text += "腦力訓練: " + entry.brain_train + "<br />";
                            info_text += "節奏: " + entry.rythm + "<br />";
                            info_text += "演出陷阱: " + entry.trap + "<br />";
                            $("#song_info_text").html(info_text);
                            // show up overlap div
                            $('#song_info_popup').popup('show');
                        }, 1000);
                    },
                    mouseup: function (layer) {
                        clearTimeout(pressTimer);
                    },

                    click: is_mobile ? null : function (layer) {
                        // 根據點燈方式做不同的點燈效果
                        var clear_state;
                        if ($("#switch_click").prop("checked") == false) {      // Clear 點燈
                            // get current state by class
                            clear_state = clearClassToValue($(this).parent());
                            // clear_state = getLocalStorage(key, 0);
                            $(this).parent().removeClass("song_clear_c");
                            $(this).parent().removeClass("song_clear_hc");
                            $(this).parent().removeClass("song_clear_uc");
                            $(this).parent().removeClass("song_clear_puc");
                            switch (clear_state) {
                            case 0:
                                $(this).setLayer('song_img', {
                                    opacity: 1
                                }).drawLayers();
                                $(this).parent().addClass("song_clear_c");
                                break;
                            case 1:
                                $(this).setLayer('song_img', {
                                    opacity: 1
                                }).drawLayers();
                                $(this).parent().addClass("song_clear_hc");
                                break;
                            case 2:
                                $(this).setLayer('song_img', {
                                    opacity: 1
                                }).drawLayers();
                                $(this).parent().addClass("song_clear_uc");
                                break;
                            case 3:
                                $(this).setLayer('song_img', {
                                    opacity: 1
                                }).drawLayers();
                                $(this).parent().addClass("song_clear_puc");
                                break;
                            case 4:
                                $(this).setLayer('song_img', {
                                    opacity: 0.2
                                }).drawLayers();
                                break;
                            }
                        } else {    // 分數點燈
                            // get current state
                            clear_state = getLocalStorage(key, 1);
                            switch (clear_state) {
                                case "0":
                                    $(this).setLayer('clear_style', {
                                        visible: true,
                                        text: "B"
                                    }).drawLayers();
                                    setLocalStorage(key, 1, "1");
                                    break;
                                case "1":
                                    $(this).setLayer('clear_style', {
                                        visible: true,
                                        text: "A"
                                    }).drawLayers();
                                    setLocalStorage(key, 1, "2");
                                    break;
                                case "2":
                                    $(this).setLayer('clear_style', {
                                        visible: true,
                                        text: "AA"
                                    }).drawLayers();
                                    setLocalStorage(key, 1, "3");
                                    break;
                                case "3":
                                    $(this).setLayer('clear_style', {
                                        visible: true,
                                        text: "AAA"
                                    }).drawLayers();
                                    setLocalStorage(key, 1, "4");
                                    break;
                                case "4":
                                    $(this).setLayer('clear_style', {
                                        visible: false
                                    }).drawLayers();
                                    setLocalStorage(key, 1, "0");
                                    break;
                            }
                        }

                        updateLink();
                    }
                });
            }

            canvas_dom.drawText({
                fillStyle: '#9cf',
                x: borderSize, y: borderSize,
                maxWidth: imageSize,
                fromCenter: false,
                fontSize: 14,
                fontFamily: 'Verdana, sans-serif, 微軟正黑體',
                align: 'left',
                layer: true,
                name: 'song_info',
                visible: false
            });

            canvas_dom.drawText({
                fillStyle: 'rgb(255,255,0)',
                strokeStyle: 'rgb(0,0,255)',
                fontStyle: 'bold',
                strokeWidth: 1,
                x: borderSize + imageSize - 2,
                y: borderSize + 2 + scoreTypeFontSize / 3,
                // x: borderSize + imageSize/2, y: borderSize + imageSize/2,
                // fromCenter: true,
                fontSize: scoreTypeFontSize,
                fontFamily: 'Consolas, Verdana, sans-serif, 微軟正黑體',
                align: 'right',
                respectAlign: true,
                layer: true,
                name: 'clear_style',
                visible: clear_visible,
                text: clear_text
            });
        }
        var value = entry.value + " " + entry.type;
        image_obj.src = "img/" + value + ".png";
    });
}

function appendSongsByLevel(level) {
    var div_id = "level" + level;
    var div_dom = $("#" + div_id);
    
    // search the db
    for (var score = 10; score >= -10; --score) {
        var db_result = music_db({ level: level, score: score }).order("title asec");
        if (db_result.count() != 0) {
            appendSongsByDbResult(db_result, div_dom, score);
        }
    }
    // remove last bottom
    div_dom.find(".score_div").last().removeClass("score_div_no_bottom");
}

function appendByScore(score) {
    var div_id = "score" + score;
    var div_dom = $("#" + div_id);
    
    // search the db
    var db_result = music_db({ score: score }).order("title asec");
    if (db_result.count() != 0) {
        appendSongsByDbResult(db_result, div_dom, "");
    }
    // remove last bottom
    div_dom.find(".score_div").last().removeClass("score_div_no_bottom");
}

/**********************************************************
 * Pictures Download & Upload
 **********************************************************/
function b64toBlob(b64_data, content_type, slice_size) {
    content_type = content_type || '';
    slice_size = slice_size || 512;

    var byte_characters = atob(b64_data);
    var byte_arrays = [];

    for (var offset = 0; offset < byte_characters.length; offset += slice_size) {
        var slice = byte_characters.slice(offset, offset + slice_size);

        var byte_numbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byte_numbers[i] = slice.charCodeAt(i);
        }

        var byte_array = new Uint8Array(byte_numbers);

        byte_arrays.push(byte_array);
    }

    var blob = new Blob(byte_arrays, { type: content_type });
    return blob;
}

function downloadAsPng() {
    html2canvas($("#levels")[0], {
        onrendered: function (canvas) {
            var img = canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
            var blob = b64toBlob(img, "imge/png");
            var url = URL.createObjectURL(blob);
            var a = $("#download_png_link")[0];
            a.href = url;
            a.download = "地力表.png";
            a.click();
        }
    });
}

function extractToken(hash) {
    var match = hash.match(/access_token=(\w+)/);
    return !!match && match[1];
};

function uploadToImgur() {
    html2canvas($("#levels")[0], {
        onrendered: function (canvas) {
            var img = canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
            sessionStorage.doUpload = true;
            sessionStorage.imageBase64 = img;
            // testing used
            // window.location = "https://api.imgur.com/oauth2/authorize?response_type=token&client_id=50df2d703759afd";
            // publish used
            window.location = "https://api.imgur.com/oauth2/authorize?response_type=token&client_id=ee6a02964edbb05";
        }
    });
}

/**********************************************************
 * Facebook APIs
 **********************************************************/
function facebookInit() {
    window.fbAsyncInit = function () {
        FB.init({
            appId: '815480455168959',
            xfbml: true,
            version: 'v2.1'
        });
    };

    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) { return; }
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
}

function statusChangeCallback(response) {
    if (response.status === 'connected') {
        // Logged into your app and Facebook.
        $("#facebook_status").html("登入成功，讀取資料中...");
        sessionStorage.fb_token = response.authResponse.accessToken;
        FB.api('/me', function (res) {
            $("#facebook_status").html("已用 " + res.name + " 帳號登入");
            sessionStorage.fb_id = res.id;
            $("#facebook_logged_in").show();
        });
    } else if (response.status === 'not_authorized') {
        // The person is logged into Facebook, but not your app.
        $("#facebook_status").html("請認證此網站");
        $("#facebook_logged_in").hide();
    } else {
        // The person is not logged into Facebook, so we're not sure if
        // they are logged into this app or not.
        $("#facebook_status").html("請登入 Facebook");
        $("#facebook_logged_in").hide();
    }
}

function checkLoginState() {
    FB.getLoginStatus(function (response) {
        statusChangeCallback(response);
    });
}

function saveWithFB() {

}

function loadFromFB() {

}

/**********************************************************
 * Customize function
 **********************************************************/
function resetSongs() {
    $(".score_div").remove();
    appendSongsByLevel(15);
    appendSongsByLevel(16);
    appendByScore(100);
    appendByScore(-100);
}

function openCustomize() {
    var window_width = $(window).width();
    var window_height = $(window).height();
    var score_style_font_size_spinner = $("#score_style_font_size").spinner();
    score_style_font_size_spinner.spinner("value", scoreTypeFontSize);
    var image_size_spinner = $("#image_size").spinner();
    image_size_spinner.spinner("value", imageSize);
    var border_size_spinner = $("#border_size").spinner();
    border_size_spinner.spinner("value", borderSize);
    $("#customize_dialog").dialog({
        closeOnEscape: true,
        draggable: false,
        modal: true,
        width: window_width * 0.8,
        height: window_height * 0.8,
        maxHeight: window_height * 0.8,
        title: "Options",
        position: { my: "center top", at: "center top+10%", of: window },
        buttons: {
            "儲存": function() {
                var font_size = score_style_font_size_spinner.spinner("value");
                localStorage.setItem("score_type_font_size", font_size);
                scoreTypeFontSize = font_size;
                var image_size = image_size_spinner.spinner("value");
                localStorage.setItem("imageSize", image_size);
                imageSize = image_size;
                var border_size = border_size_spinner.spinner("value");
                localStorage.setItem("border_size", border_size);
                borderSize = border_size;

                resetSongs();
                $(this).dialog("close");
            },
            "回到預設": function () {
                score_style_font_size_spinner.spinner("value", 24);
                image_size_spinner.spinner("value", 128);
                border_size_spinner.spinner("value", 6);
            },
            "取消": function() {
                $(this).dialog("close");
            }
        },
        close: function(event, ui) {
            $('#wrap').show(); $("body").removeClass("no_scroll");
        },
        open: function (event, ui) { $('.ui-widget-overlay').bind('click', function () { $("#customize_dialog").dialog('close'); }); $("body").addClass("no_scroll"); },
        show: { effect: "blind", duration: 500 },
        hide: { effect: "blind", duration: 500 }
    });
}

/**********************************************************
 * Document ready function
 **********************************************************/
$(document).ready(function () {
    // flush localStorage
    if (localStorage.length == 0) {
        resetLocalStorage();
    }

    // 更新 settings
    if (localStorage.getItem("imageSize") != undefined)
        imageSize = parseInt(localStorage.getItem("imageSize"));
    if (localStorage.getItem("borderSize") != undefined)
        borderSize = parseInt(localStorage.getItem("borderSize"));
    if (localStorage.getItem("score_type_font_size") != undefined)
        scoreTypeFontSize = parseInt(localStorage.getItem("score_type_font_size"));

    // get localStorage
    var rec = $.url().param("rec");
    if (rec != undefined) {
        var parsed_rec = lzwDecode(rec);
        localStorage.setItem("rec", parsed_rec);
    }

    // append level 15 songs
    appendSongsByLevel(15);
    appendSongsByLevel(16);
    appendByScore(100);
    appendByScore(-100);

    $("#save_to_browser").on("click", saveToLocalStorage);
    $("#load_from_browser").on("click", loadFromLocalStorage);
    $("#generate_link").on("click", updateLink);

    $("#download_as_png").on("click", downloadAsPng);
    $("#clear_all_btn").on("click", clearAll);
    $("#upload_to_imgur").on("click", uploadToImgur);

    $("#customize").on("click", openCustomize);

    $('#song_info_popup').popup({
        blur: false,
        scrolllock: false,
        transition: 'all 0.3s'
    });

    // 檢查 upload to imgur 是否被 trigger
    var token = extractToken(document.location.hash);
    if (token && JSON.parse(sessionStorage.doUpload)) {
        sessionStorage.doUpload = false;
        $("#levels").hide();
        $("#upload_info").show();

        $.ajax({
            url: 'https://api.imgur.com/3/image',
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token,
                Accept: 'application/json'
            },
            data: {
                image: sessionStorage.imageBase64,
                type: 'base64'
            },
            xhr: function () {
                var xhr = new window.XMLHttpRequest();
                //Upload progress
                xhr.upload.addEventListener("progress", function (evt) {
                    if (evt.lengthComputable) {
                        var percent_complete = evt.loaded / evt.total;
                        //Do something with upload progress
                        $("#upload_percent").text((percent_complete * 100).toFixed(2) + "%");
                    }
                }, false);
                return xhr;
            },
            success: function (result) {
                var id = result.data.id;
                window.location = 'https://imgur.com/gallery/' + id;
            }
        });
    }

    // 設定 FB 按鈕
    $("#save_with_fb").on("click", saveWithFB);
    $("#load_from_fb").on("click", loadFromFB);


    var window_width = $(window).width();
    var window_height = $(window).height();
    $("#tabs").tabs();
    $("#updates_accordion").accordion({
        heightStyle: "content"
    });
    // 跳出 infomation 視窗
    $("#information").dialog({
        closeOnEscape: true,
        draggable: false,
        modal: true,
        width: window_width * 0.8,
        height: window_height * 0.8,
        maxHeight: window_height * 0.8,
        title: "Information",
        position: { my: "center top", at: "center top+10%", of: window },
        close: function(event, ui) { $('#wrap').show(); $("body").removeClass("no_scroll"); },
        open: function(event, ui) { $('.ui-widget-overlay').bind('click', function(){ $("#information").dialog('close'); }); $("body").addClass("no_scroll"); },
        show: { effect: "blind", duration: 500 },
        hide: { effect: "blind", duration: 500 }
    });
});