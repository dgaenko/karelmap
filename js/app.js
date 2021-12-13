jQuery.fn.visible = function() {
    return this.css('visibility', 'visible');
};

jQuery.fn.invisible = function() {
    return this.css('visibility', 'hidden');
};

jQuery.fn.visibilityToggle = function() {
    return this.css('visibility', function(i, visibility) {
        return (visibility == 'visible') ? 'hidden' : 'visible';
    });
};


function onSpinner() {
    let spinner = '<div class="on-load-wrap"><div class="on-load"><div class="spinner"></div></div></div>';
    $('.map-wrap').append(spinner);
}
function offSpinner() {
    $('.on-load-wrap').remove();
}

const app = {

    debug: false,

    url: "http://karmap.gamma.interso.ru/",
    api: "local/templates/karmap/ajax/",

    region_id: 0,
    region_name: "",
    cat_id: 0,
    color: "#000",

    dd: function () {
        if (this.debug) {
            for (let i = 0; i < arguments.length; i++) {
                console.log(arguments[i]);
            }
        }
    },

    apiUrl: function () {
        return this.url + this.api;
    },

    render: function (tpl_selector, params) {
        const tmpl = $.templates(tpl_selector);
        return tmpl.render(params);
    },

    showMiddleBox: function (pr_html) {
        this.dd("showMiddleBox");
        $('.completed-modal__content').html(pr_html);
        app.showCompletedModal(true);
        $('.close-completed-modal').unbind("click").click (function () {
            event.preventDefault();
            app.showCompletedModal(false);
        });
    },

    showCompletedModal: function (show) {
        this.dd("showCompletedModal " + show);
        $('.completed-modal').scrollTop(0);
        if (show) {
            $('.completed-modal').addClass('active');
        } else {
            $('.completed-modal').removeClass('active');
        }
    },

    showRegionsModal: function (show) {
        this.dd("showRegionsModal " + show);
        $('.regions-modal').scrollTop(0);
        if (show) {
            $('.regions-modal').addClass('active');
        } else {
            $('.regions-modal').removeClass('active');
        }
    },

    showCategoryModal: function (show) {
        this.dd("showCategoryModal " + show);
        $('.category-modal').scrollTop(0);
        if (show) {
            $('.category-modal').addClass('active');
        } else {
            $('.category-modal').removeClass('active');
        }
    },

    showProjectModal: function (show) {
        this.dd("showProjectModal " + show);
        $('.project-modal').scrollTop(0);
        if (show) {
            $('.project-modal').addClass('active');
        } else {
            $('.project-modal').removeClass('active');
        }
    },

    showRegionInfo: function (id) {
        this.dd("showRegionInfo id:" + id);
        $('.completed-modal').removeClass('active');
        app.loadRegion(id);
        app.showRegionsModal(false);
    },

    showObjectInfo: function (obj_id) {
        app.dd("showObjectInfo " + obj_id);
        app.loadObjectInfo(obj_id);
    },

    loadObjectInfo: function (obj_id) {
        app.dd("loadObjectInfo obj_id:" + obj_id);
        onSpinner();
        let url = this.apiUrl() + "getObject.php?id=" + obj_id;
        app.dd(url);
        $.get(url)
            .done(function (response) {
                response.site = app.url;
                app.dd(response);
                const html = app.render("#tpl_object", response);
                $(".project-modal__content").html(html);

                if (response.object.webcam && response.object.webcam.type != "another") {
                    $(".camera-modal-link").unbind("click").click(function () {
                        if (response.object.webcam.type == "sampo") {
                            const s = encodeURI(response.object.webcam.link);
                            $(".webcam-block-wrapper iframe").attr("src", "camera.php?s=" + s);
                            //$(".webcam-block-wrapper").html(response.object.webcam.link);
                        }
                        if (response.object.webcam.type == "citylink") {
                            const s = "https://www.geocam.ru/js/player/playerjs.html?file=https://s2.moidom-stream.ru/s/public/0000001203.m3u8&poster=https://s2.moidom-stream.ru/s/public/0000001203.jpg";
                            $(".webcam-block-wrapper iframe").attr("src", s);
                        }
                        $("#camera-modal").modal("show");
                    });
                } else {
                    $(".camera-modal-link").attr("href", response.object.webcam.link);
                }

                app.showProjectModal(true);
                response.object.color = app.color;
                map.showMarkers([ response.object ]);
                offSpinner();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            }
        );
    },

    loadReleasedObjects: function (region_id, cat_id, realize_status, page) {
        app.dd("loadReleasedObjects region_id:" + region_id + " cat_id:" + cat_id);
        onSpinner();
        let url = this.apiUrl() + "getObjectsList.php?";
        if (region_id) {
            url += "&regionId=" + region_id;
        }
        if (cat_id) {
            url += "&categoryId=" + cat_id;
        }
        if (realize_status) {
            url += "&realizeStatus=" + realize_status;
        }
        if (!page) page = 1;
        url += "&page=" + page;
        this.dd(url);
        $.get(url)
            .done(function (response){
                app.dd(response);
                const html = app.render("#tpl_released", response);
                app.showMiddleBox(html);
                app.loadRealizedCount(app.cat_id, ".completed-modal");
                $(".completed-modal .object_link").unbind("click").click(function (){
                    let obj_id = $(this).attr("data-id");
                    app.color = $(this).attr("data-color");
                    app.showObjectInfo(obj_id);
                });
                app.showNavigation(".completed-modal", response.list_navigation, function (page){
                    app.loadReleasedObjects(app.region_id, app.cat_id, realize_status, page);
                    app.loadRealizedCount(app.cat_id, ".completed-modal");
                });
                offSpinner();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            }
        );
    },

    loadRegion: function (region_id) {
        this.dd("loadRegion id:" + region_id);
        if (!region_id) {
            return;
        }
        onSpinner();
        const url = this.apiUrl() + "getRegion.php?id=" + region_id;
        this.dd(url);
        $.get(url)
            .done(function (response){
                app.loadObjectsList(region_id, 0, false, function (){
                    map.showRayon(response.region.name);
                });
                $(".section_region").fadeIn();
                $(".section_cats").hide();
                response.site = app.url;
                app.dd(response)
                app.region_name = response.region.name;
                app.cat_id = 0;
                const html = app.render("#tpl_region", response);
                $(".section_region").html(html);
                app.loadCategories(region_id, ".section_region .list");
                $(".section_region .get-regions").unbind("click").click(function (){
                    app.showRegionsModal(true);
                });
                $(".section_region .back-btn").unbind("click").click(function () {
                    app.dd("CATEGORY BACK");
                    event.preventDefault();
                    $(".section_cats").fadeIn();
                    $(".section_region").fadeOut();
                    app.showRegionsModal(false);
                    $('.completed-modal').removeClass('active');
                    app.region_id = 0;
                    app.region_name = "";
                    app.loadObjectsList();
                });
                if (response.region.objects_realized_count) {
                    $(".section_region .expertise__btn").unbind("click").click(function () {
                        event.preventDefault();
                        const region_id = $(this).attr("data-id");
                        app.cat_id = 0;
                        app.loadReleasedObjects(region_id, app.cat_id, true);
                    });
                }
                offSpinner();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            }
        );
    },

    loadRegions: function () {
        this.dd("loadRegions");
        onSpinner();
        $.get(this.apiUrl() + "getRegionsList.php")
            .done(function (response){
                app.dd(response)
                response.site = app.url;
                const html = app.render("#tpl_regions", response);
                $(".regions-modal .list").html(html);
                $(".region_btn").unbind("click").click(function (el){
                    event.preventDefault();
                    const id = $(this).attr("data-id");
                    app.showRegionInfo(id);
                    app.region_id = id;
                });
                offSpinner();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            }
        );
    },

    loadRealizedCount: function (cat_id, container) {
        this.dd("loadRealizedCount cat_id:" + cat_id + " container:" + container);
        const url = this.apiUrl() + "getObjectsList.php?regionId=" + app.region_id + "&categoryId=" + cat_id;
        $.get(url)
            .done(function (response){
                $(container + " .realized").html(response.objects_realized_count);
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
            });
    },

    loadCategory: function (cat_id, page) {
        this.dd("loadCategory cat_id:" + cat_id);
        onSpinner();
        const url = this.apiUrl() + "getObjectsList.php?regionId=" + app.region_id + "&categoryId=" + cat_id + "&page=" + page;
        this.dd(url);
        $.get(url)
            .done(function (response){
                app.dd(response);
                offSpinner();
                const html = app.render("#tpl_cat_objects", response);
                $(".category-modal__content").html(html);
                $(".category-modal .object_link").unbind("click").click(function () {
                    event.preventDefault();
                    let obj_id = $(this).attr("data-id");
                    app.showObjectInfo(obj_id);
                });
                if (1 || response.objects_realized_count) {
                    app.dd("CATEGORY REALIZED");
                    // Кнопка завершенные объекты
                    $(".category-modal .expertise__btn").unbind("click").click(function () {
                        event.preventDefault();
                        app.loadReleasedObjects(app.region_id, cat_id, true);
                    });
                }
                app.loadRealizedCount(cat_id, ".category-modal");
                app.showNavigation(".category-modal", response.list_navigation, function (page){
                    app.loadCategory(app.cat_id, page);
                });
                app.showCompletedModal(false);
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            });
        app.showCategoryModal(true);
    },

    showNavigation: function (container, list_navigation, callback) {
        this.dd("showNavigation " + container);
        if (!list_navigation) {
            $(container + " .list-navigation-row").hide();
            return;
        }
        $(container + " .list-navigation-row").show();
        if (list_navigation.prev_page) {
            $(container + " .list-navigation-row .back").visible();
            $(container + " .list-navigation-row .back").unbind('click').click(function (){
                app.dd("back", app.cat_id, list_navigation.prev_page);
                event.preventDefault();
                callback(list_navigation.prev_page);
            })
        } else {
            $(container + " .list-navigation-row .back").invisible();
        }
        if (list_navigation.next_page) {
            $(container + " .list-navigation-row .next").visible();
            $(container + " .list-navigation-row .next").unbind('click').click(function (){
                app.dd("next", app.cat_id, list_navigation.next_page);
                event.preventDefault();
                callback(list_navigation.next_page);
            })
        } else {
            $(container + " .list-navigation-row .next").invisible();
        }
    },

    loadCategories: function (id, container_selector) {
        this.dd("loadCategories id:" + id + " conteiner:" + container_selector);
        let url = this.apiUrl() + "getCategoriesList.php";
        if (id) {
            url += "?regionId=" + id;
        }
        onSpinner();
        $.get(url)
            .done(function (response){
                app.dd(response);
                response.site = app.url;
                const html = app.render("#tpl_cats", response);
                $(container_selector).html(html);
                $(".category_btn").unbind("click").click(function (){
                    event.preventDefault();
                    const cat_id = $(this).attr("data-id");
                    app.color = $(this).attr("data-color");
                    app.loadCategory(cat_id, 1);
                    app.loadObjectsList(app.region_id, cat_id, false, function () {
                        map.showRayon(app.region_name);
                    });
                    app.cat_id = cat_id;
                });
                offSpinner();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            }
        );
    },

    loadObjectsList: function (region_id, cat_id, realize_status, callback) {
        this.dd("loadObjectsList region_id:" + region_id + " cat_id:" + cat_id + " realize_status:" + realize_status);
        let url = this.apiUrl() + "getObjectsList.php?";
        this.dd(url);
        if (region_id) {
            url += "&regionId=" + region_id;
        }
        if (cat_id) {
            url += "&categoryId=" + cat_id;
        }
        if (realize_status) {
            url += "&realizeStatus=" + realize_status;
        }
        onSpinner();
        $.get(url)
            .done(function (response){
                app.dd(response);
                map.showMarkers(response.objects_list, function () {
                    if (!region_id && !cat_id) {
                        map.showKarelRegion();
                    }
                    if (callback) callback();
                });
                offSpinner();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                offSpinner();
            }
        );
    },

    init: function () {
        this.dd("init");
        //setTimeout(function (){ onSpinner(); }, 50);
        $(".category-modal .back-btn").unbind("click").click(function () {
            app.dd("PROJECTS BACK region_id:" + app.region_id + " cat_id:" + app.cat_id);
            if (!app.region_id) app.cat_id = 0;
            event.preventDefault();
            event.stopPropagation();
            app.showCompletedModal(false);
            app.showCategoryModal(false);
            app.loadObjectsList(app.region_id, app.cat_id);
            app.loadRegion(app.region_id);
        });
        $(".section_cats .expertise__btn").unbind("click").click(function (){
            event.preventDefault();
            app.cat_id = 0;
            app.loadReleasedObjects(0, 0, true, function (){
                map.showRayon(app.region_name);
            });
        });
        $(".project-modal .back-btn").unbind("click").click(function (){
            app.dd("PROJECT BACK region_id:" + app.region_id + " cat_id:" + app.cat_id);
            event.preventDefault();
            if (!app.cat_id) {
                app.loadRegion(app.region_id);
            }
            app.loadObjectsList(app.region_id, app.cat_id, false, function (){
                map.showRayon(app.region_name);
            });
            app.showProjectModal(false);
        });
        this.loadRegions();
        this.loadCategories(0, ".section_cats .list");
    }

}

$(function (){
    app.init();
    setInterval(() => {
        $(".debug_info").html("reg_id: " + app.region_id + "<br>cat_id:" + app.cat_id);
    }, 100);
})
