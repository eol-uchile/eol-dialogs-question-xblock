/*
        .-"-.
       /|6 6|\
      {/(_0_)\}
       _/ ^ \_
      (/ /^\ \)-'
       ""' '""
*/


function DialogsQuestionsXBlock(runtime, element, settings) {
    var $ = window.jQuery;
    var $element = $(element);
    var buttonSubmit = $element.find('.submit');
    var subFeedback = $element.find('.submission-feedback');
    var statusDiv = $element.find('.status');
    var handlerUrlSaveStudentAnswers = runtime.handlerUrl(element, 'savestudentanswers');
    var handlerUrlShowAnswers = runtime.handlerUrl(element, 'getanswers');

    function updateText(result) {
        //actualizo el texto de correcto o incorrecto
        if(result.show_correctness != 'never'){
            if(result.score >= 1){
                $element.find('.notificacion').html('');
                $element.find('.notificacion').removeClass('incorrecto');
                $element.find('.notificacion').removeClass('dontshowcorrectness');
                $element.find('.notificacion').addClass('correcto');
                $element.find('.notificacion.correcto').html('<img src="'+settings.image_path+'correct-icon.png"/> ¡Respuesta Correcta!');
            }
            else{
                $element.find('.notificacion').html('');
                $element.find('.notificacion').removeClass('correcto');
                $element.find('.notificacion').removeClass('dontshowcorrectness');
                $element.find('.notificacion').addClass('incorrecto');
                if(result.score > 0){
                    $element.find('.notificacion.incorrecto').html('<img src="'+settings.image_path+'partial-icon.png"/> Respuesta parcialmente correcta');
                }
                else{
                    $element.find('.notificacion.incorrecto').html('<img src="'+settings.image_path+'incorrect-icon.png"/> Respuesta Incorrecta');
                }
            }
            
            statusDiv.removeClass('correct');
            statusDiv.removeClass('incorrect');
            statusDiv.removeClass('unanswered');
            statusDiv.addClass(result.indicator_class);
        }else{
            statusDiv.removeClass('correct');
            statusDiv.removeClass('incorrect');
            statusDiv.removeClass('unanswered');
            //no deberia pasar pero por si las moscas
            if(result.indicator_class == 'unanswered')
                statusDiv.addClass('unanswered');
            $element.find('.notificacion').html('');
            $element.find('.notificacion').removeClass('correcto');
            $element.find('.notificacion').removeClass('incorrecto');
            $element.find('.notificacion').addClass('dontshowcorrectness');
            $element.find('.notificacion.dontshowcorrectness').html('<span class="icon fa fa-info-circle" aria-hidden="true"></span>Respuesta enviada.');
        }

        //desactivo el boton si es que se supero el nro de intentos
        var finalice = false;
        if(result.max_attempts > 0){
            subFeedback.text('Has realizado '+result.attempts+' de '+result.max_attempts+' intentos');
            if(result.attempts >= result.max_attempts){
                buttonSubmit.attr("disabled", true);
                finalice = true;
            }
            else{
                buttonSubmit.attr("disabled", false);
            }

            if(result.errores){
                $element.find('.notificacion').html('<span class="icon fa fa-info-circle" aria-hidden="true"></span>Error: El estado de este problema fue modificado, por favor recargue la página.');
            }
        }
        else{
            buttonSubmit.attr("disabled", false);
        }

        if(finalice || (result.attempts >0 && result.max_attempts <= 0)){
            if(result.show_answer == 'Finalizado' && !$element.find('.button_show_answers').length && result.show_correctness != 'never'){
                var mostrar_resp = '<span class="button_show_answers">Mostrar Respuesta</span>';
                $element.find('.responder').append(mostrar_resp);
                clickShowAnswers();
            }
        }

        buttonSubmit.html("<span>" + buttonSubmit[0].dataset.value + "</span>");
    }

    function updateTextShowAnsers(result) {
        var $obj = '';
        $obj = $('<html></html>');
        $obj.html('<b>Respuesta: </b>'+$element.find('.dialogo').html());
        $.each($obj.find(".inputdialogo"), function(j,v){
            $(v).replaceWith(result.answers[$(v).attr('question-id')]);
        })
        $.each($obj.find(".dropdowndialogo"), function(j,v){
            $(v).replaceWith(result.answers[$(v).attr('question-id')]);
        })
        $element.find('.the_answer').html($obj.html());
    }

    $(function ($) {

        findquestions($element.find('.dialogo'));
        writeStudentAnswers();
        widthInput();
        actionkeyInput();
        clickSubmit();
        clickShowAnswers();
        clickEnableSubmit();
    });

    function widthInput(){
        $element.find('input').each(function(){
            $(this).css("width", (this.value.length + 1) + 'ch');
        });
    }

    function actionkeyInput(){
        $element.find('input').on('keyup', function(){
            $(this).css("width", (this.value.length + 1) + 'ch');
        });
    }

    function clickSubmit(){
        buttonSubmit = $element.find('.submit');
        buttonSubmit.click(function(eventObject) {
            eventObject.preventDefault();
            buttonSubmit.html("<span>" + buttonSubmit[0].dataset.checking + "</span>");
            buttonSubmit.attr("disabled", true);
            var student_answers = {};
            $element.find('.inputdialogo').each(function() {
                student_answers[$(this).attr('question-id')] = $(this).val();
            });
            $element.find('.dropdowndialogo').each(function() {
                student_answers[$(this).attr('question-id')] = $(this).val();
            });
            $.ajax({
                type: "POST",
                url: handlerUrlSaveStudentAnswers,
                data: JSON.stringify({"student_answers": student_answers}),
                success: updateText
            });
        });
    }

    function clickShowAnswers(){
        buttonShowAnswers = $element.find('.button_show_answers');
        buttonShowAnswers.click(function(eventObject) {
            eventObject.preventDefault();
            $.ajax({
                type: "POST",
                url: handlerUrlShowAnswers,
                data: JSON.stringify({"holi": "holi"}),
                success: updateTextShowAnsers
            });
        });
    }

    function clickEnableSubmit(){
        if(statusDiv.hasClass('unanswered')){
            buttonSubmit = $element.find('.submit');
            $element.find('input').on('keyup', function(){
                buttonSubmit.attr("disabled", false);
            });
            $element.find('select').on('change', function(){
                buttonSubmit.attr("disabled", false);
            });
        }
    }

    function writeStudentAnswers(){
        $element.find('.thestudentanswers').each(function() {
            var valor = $(this).val();
            $element.find('[question-id="'+$(this).attr('q-id')+'"]').each(function(){
                $(this).val(valor);
            });
        });
    }
}
