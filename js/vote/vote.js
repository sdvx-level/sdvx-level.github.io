var imageSize = 128;
var borderSize = 6;

// var phpHost = "http://sdvxlevel.host-ed.me/";
var phpHost = "http://sdvxlevel.lionfree.net/";

function appendSongsByDbResult(db_result, div_dom, header_text) {
    // append new row
    div_dom.append("<div class='score_div score_div_no_bottom' data-music-score='-100'><div class='right_div'></div></div>");
    // set score text
    // div_dom.find(".left_div").last().text(header_text);

    var div_right_dom = div_dom.find(".right_div").last();
    db_result.each(function (entry) {
        // append new div and song
        div_right_dom.append("<div class='elem' data-music-id='" + entry.id + "'></div>");
        var elem_dom = div_right_dom.find("div").last();
        var key = entry.id;
        
        elem_dom.append("<canvas class='song_img' height='" + (imageSize + borderSize * 2) + "' width='" + (imageSize + borderSize * 2) + "'> </canvas>");
        var canvas_dom = elem_dom.find("canvas").last();

        var image_obj = new Image();
        image_obj.onload = function () {
            canvas_dom.drawImage({
                source: image_obj,
                opacity: 1,
                x: borderSize,
                y: borderSize,
                width: imageSize,
                height: imageSize,
                fromCenter: false,
                layer: true,
                name: 'song_img'
            });
        }
        var value = entry.value + " " + entry.type;
        image_obj.src = "img/" + value + ".png";
    });
}

function initialSongsByLevel(level) {
    var div_dom = $("#not_included");

    var db_result = music_db({ level: level }).order("title asec");
    appendSongsByDbResult(db_result, div_dom, "");

    // remove last bottom
    div_dom.find(".score_div").last().removeClass("score_div_no_bottom");
}

function appendTablesAtLevel(level) {
    var div_dom = $("#level" + level);
    for (var score = 6; score >= -6; --score) {
        div_dom.append("<div class='score_div score_div_no_bottom' data-music-score='" + score + "'><div class='left_div'>" + score + "</div><div class='right_div'></div></div>");
    }
    // TODO: check if elems fill in, height will change or not
    div_dom.find(".left_div").css("height", (imageSize + borderSize * 2 - 2).toString() + "px");
    div_dom.find(".score_div").last().removeClass("score_div_no_bottom");

    div_dom = $("#score100");
    div_dom.append("<div class='score_div score_div_no_bottom' data-music-score='100'><div class='left_div'></div><div class='right_div'></div></div>");
    div_dom.find(".score_div").last().removeClass("score_div_no_bottom");
}

function getScoreByElem(elem) {
    return $(elem).parent().parent().data("music-score");
}

function saveToAccount() {
    var dict = {};
    $(".elem").each(function() {
        var id = $(this).data("music-id");
        var score = $(this).parent().parent().data("music-score");
        dict[id] = score;
    });
    
    var vote = JSON.stringify(dict);
    var username = localStorage.getItem("username");
    var password = localStorage.getItem("password");
    $.post(phpHost + "put_vote.php", {
        "username": username,
        "password": password,
        "vote": vote
    }, function (data) {
        if (data.status == 0) {
        } else {
        }
        $("#status_dialog").dialog("close");
    }, "json");
}

$(document).ready(function () {
    google.load("visualization", "1", { packages: ["corechart"] });

    var username = localStorage.getItem("username");
    var password = localStorage.getItem("password");

    if (username == null || password == null) {
        window.location = "index.html";
    }

    $("#status_dialog").dialog({
        closeOnEscape: false,
        draggable: false,
        modal: true,
        width: 300,
        height: 300,
        title: "系統訊息",
        position: { my: "center top", at: "center top+10%", of: window },
        close: function (event, ui) { $("body").removeClass("no_scroll"); },
        open: function (event, ui) {
            $("body").addClass("no_scroll");
            $(".ui-dialog-titlebar-close").hide();
        },
        show: { effect: "blind", duration: 500 },
        hide: { effect: "blind", duration: 500 }
    });

    initialSongsByLevel(15);
    appendTablesAtLevel(15);

    // set all score_div class to image height
    $(".score_div").css("min-height", (imageSize + borderSize * 2 - 2).toString() + "px");

    $(".elem").draggable({
        scroll: true,
        revert: true
    });
    $('.score_div').droppable({
        drop: function (ev, ui) {
            $(ui.draggable).detach().css({ top: 0, left: 0 }).appendTo($(this).find(".right_div"));
        }
    });

    // set buttons
    $("#save").button().on("click", function () {
        $("#status_dialog").html("儲存中...").dialog("open");
        saveToAccount();
    });

    // Load user vote state
    $.post(phpHost + "get_vote_new.php", {
        "username": username,
        "password": password
    }, function (data) {
        if (data.status == 0) {
            var dict = JSON.parse(data.vote);
            $(".elem").each(function () {
                var id = $(this).data("music-id");
                var score = dict[id];
                if (score == undefined)
                    score = -100;
                var elem_dom = $(this);
                $(".score_div[data-music-score=" + score + "]").find(".right_div").append(elem_dom.detach().css({ top: 0, left: 0 }));
            });

            var song_vote_result = JSON.parse(data.result);
            $(document).tooltip({
                items: ".elem",
                content: function() {
                    var element = $(this);
                    var scores = song_vote_result[element.data("music-id")];
                    if (scores != undefined) {
                        return '<div id="chart_div" data-music-id="' + element.data("music-id") + '" style="width: 576px; height: 324px;"></div>';
                    }
                    return "";
                },
                close: function() {
                    $(".ui-helper-hidden-accessible").remove();
                },
                open: function(event, ui) {
                    var scores = song_vote_result[ui.tooltip.find("#chart_div").data("music-id")];
                    drawChart(ui.tooltip.find("#chart_div")[0], scores);
                }
            });
            $("#status_dialog").dialog("close");
        } else {
            $("#status_dialog").dialog("close");
        }
    }, "json");
});


function drawChart(chart_div, scores) {
    var content = [['分數', '票數']];
    content.push(["個 人 差", scores.reduce(function (total, x) { return x == 100 ? total + 1 : total; }, 0)]);
    for (var i = -6; i <= 6; ++i) {
        content.push([i.toString(), scores.reduce(function (total, x) { return x == i ? total + 1 : total; }, 0)]);
    }

    var data = google.visualization.arrayToDataTable(content);

    var options = {
        legend: {
            position: "none"
        },
        tooltip: {
        },
        vAxis: {
            minValue: 0,
            gridlines: {
                count: -1
            }
        },
        fontName: "Consolas, 微軟正黑體",
        hAxis: {
            maxAlternation: 1
        },
        chartArea: {
            width: "90%",
            height: "80%",
            top: "5%"
        }
    };

    var chart = new google.visualization.ColumnChart(chart_div);

    chart.draw(data, options);

}