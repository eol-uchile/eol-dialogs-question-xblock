function findquestions(d, replace = true) {
    var answers = {};
    var c = 1;
    //reviso si hay inputs o dropdowns en el dialogo
    //pongo los inputs
    $.each($(d).find(".inputdialogo"), function(j,v){
        var answer = $(v).text();
        var input = $('<input/>').attr({ type: 'text', class: 'inputdialogo', 'question-id':c});
        answers[c] = answer;
        c++;
        if(replace)
            $(v).replaceWith(input);
    });
    //pongo los dropdowns
    $.each($(d).find(".dropdowndialogo"), function(j,v){
        var select = $('<select/>').attr({ class: 'dropdowndialogo' });
        select.append($('<option/>').attr({ value: 'Selecciona' }).html('Selecciona'));
        var opcionesStr = $(v).text();
        var opciones = opcionesStr.split(',');
        for(var i in opciones){
            var opc = opciones[i];
            //veo si es la correcta (entre parentesis)
            if(opc.charAt(0) == "(" && opc.charAt(opc.length - 1) == ")"){
                //saco los parentesis
                opciones[i] = opciones[i].slice(1, -1);
                select.attr("question-id",c);
                answers[c] = opciones[i];
                c++;
            }
            select.append($('<option/>').attr({ value: opciones[i] }).html(opciones[i]));
        }
        if(replace)
            $(v).replaceWith(select);
    });
    return answers;
}