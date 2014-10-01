var image_size = 128;
var border_size = 6;

var pressTimer;

function saveToLocalStorage() {
    $(".elem").each(function (i) {
        var music_value = $(this).data("music-value");
        if ($(this).hasClass("song_clear_c"))
            setLocalStorage(music_value, 0, "1");
        else if($(this).hasClass("song_clear_hc"))
            setLocalStorage(music_value, 0, "2");
        else if($(this).hasClass("song_clear_uc"))
            setLocalStorage(music_value, 0, "3");
        else if ($(this).hasClass("song_clear_puc"))
            setLocalStorage(music_value, 0, "4");
        else
            setLocalStorage(music_value, 0, "0");
    });
    updateLink();
}

function readFromLocalStorage() {
    $(".elem").each(function(i) {
        var music_value = $(this).data("music-value");
        if (getLocalStorage(music_value, 0) == "1") {
        // if (localStorage.getItem(music_value) == "1") {
            $(this).addClass("elem_background");
            $(this).find("canvas").setLayer('song_img', { opacity: 1 }).drawLayers();
        } else {
            $(this).removeClass("elem_background");
            $(this).find("canvas").setLayer('song_img', { opacity: 0.2 }).drawLayers();
        }
    });
}

function updateLink() {
    var text = "?rec=";
    for (var i = 0; i < localStorage.length; ++i) {
        text += getLocalStorage(localStorage.key(i), 0) + "," + getLocalStorage(localStorage.key(i), 1) + "|";
        // text += localStorage.getItem(localStorage.key(i)) + ",";
    }
    text = text.substring(0, text.length - 1);
    text = $.url().attr("host") + $.url().attr("path") + text;
    $("#link").val(text);
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function getLocalStorage(key, index) {
    return JSON.parse(localStorage.getItem(key) || "[]")[index];
}

function setLocalStorage(key, index, value) {
    var original_value = JSON.parse(localStorage.getItem(key) || "[]");
    original_value[index] = value;
    localStorage.setItem(key, JSON.stringify(original_value));
}

function appendSongsByDbResult(db_result, div_dom, header_text) {
    // append new row
    div_dom.append("<div class='score_div score_div_no_bottom'><div class='left_div'></div><div class='right_div'></div></div>");
    // set score text
    div_dom.find(".left_div").last().text(header_text);

    var div_right_dom = div_dom.find(".right_div").last();
    db_result.each(function (entry) {
        // append new div and song
        div_right_dom.append("<div class='elem' data-music-value=\"" + entry.value + " " + entry.type + "\"></div>");
        var elem_dom = div_right_dom.find("div").last();
        var key = entry.value + " " + entry.type;

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

        elem_dom.append("<canvas class='song_img' height='" + (image_size + border_size * 2) + "' width='" + (image_size + border_size * 2) + "'> </canvas>");
        var canvas_dom = elem_dom.find("canvas").last();

        var image_obj = new Image();
        var is_mobile = isMobile();
        image_obj.onload = function () {
            if (is_mobile) {
                canvas_dom.drawImage({
                    source: image_obj,
                    opacity: 1,
                    x: border_size,
                    y: border_size,
                    width: image_size,
                    height: image_size,
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
                    x: border_size,
                    y: border_size,
                    width: image_size,
                    height: image_size,
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
                            // get current state
                            clear_state = getLocalStorage(key, 0);
                            $(this).parent().removeClass("song_clear_c");
                            $(this).parent().removeClass("song_clear_hc");
                            $(this).parent().removeClass("song_clear_uc");
                            $(this).parent().removeClass("song_clear_puc");
                            switch (clear_state) {
                            case "0":
                                $(this).setLayer('song_img', {
                                    opacity: 1
                                }).drawLayers();
                                $(this).parent().addClass("song_clear_c");
                                setLocalStorage(key, 0, "1");
                                break;
                            case "1":
                                $(this).setLayer('song_img', {
                                    opacity: 1
                                }).drawLayers();
                                $(this).parent().addClass("song_clear_hc");
                                setLocalStorage(key, 0, "2");
                                break;
                            case "2":
                                $(this).setLayer('song_img', {
                                    opacity: 1
                                }).drawLayers();
                                $(this).parent().addClass("song_clear_uc");
                                setLocalStorage(key, 0, "3");
                                break;
                            case "3":
                                $(this).setLayer('song_img', {
                                    opacity: 1
                                }).drawLayers();
                                $(this).parent().addClass("song_clear_puc");
                                setLocalStorage(key, 0, "4");
                                break;
                            case "4":
                                $(this).setLayer('song_img', {
                                    opacity: 0.2
                                }).drawLayers();
                                setLocalStorage(key, 0, "0");
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
                x: border_size, y: border_size,
                maxWidth: image_size,
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
                x: border_size + image_size - 2,
                y: border_size + 10,
                // x: border_size + image_size/2, y: border_size + image_size/2,
                // fromCenter: true,
                fontSize: 24,
                fontFamily: 'Consolas, Verdana, sans-serif, 微軟正黑體',
                align: 'right',
                respectAlign: true,
                layer: true,
                name: 'clear_style',
                visible: clear_visible,
                text: clear_text
            });
        }
        image_obj.src = "img/" + key + ".png";
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

function clearAll() {
    $(".elem").each(function () {
        $(this).removeClass("song_clear_c");
        $(this).removeClass("song_clear_hc");
        $(this).removeClass("song_clear_uc");
        $(this).removeClass("song_clear_puc");
        $(this).find("canvas").setLayer("clear_style", {
            visible: false
        });
        $(this).find("canvas").setLayer("song_img", { opacity: 0.2 }).drawLayers();
    });
    localStorage.clear();
    resetLocalStorage();
    updateLink();
}

function resetLocalStorage() {
    var db_result = music_db();
    db_result.each(function (entry) {
        var key = entry.value + " " + entry.type;
        setLocalStorage(key, 0, "0");
        setLocalStorage(key, 1, "0");
    });
}

$(document).ready(function () {
    // flush localStorage
    if (localStorage.length == 0) {
        resetLocalStorage();
    }

    // get localStorage
    var rec = $.url().param("rec");
    if (rec != undefined) {
        var parsed_rec = rec.split("|");
        for (var index in parsed_rec) {
            var arr = parsed_rec[index].split(",");
            setLocalStorage(localStorage.key(index), 0, arr[0]);
            setLocalStorage(localStorage.key(index), 1, arr[1]);
        }
        updateLink();
    }

    // append level 15 songs
    appendSongsByLevel(15);
    appendSongsByLevel(16);
    appendByScore(100);
    appendByScore(-100);

    $("#download_as_png").on("click", downloadAsPng);
    $("#clear_all_btn").on("click", clearAll);
    $("#upload_to_imgur").on("click", uploadToImgur);

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
});