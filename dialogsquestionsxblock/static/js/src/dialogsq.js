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
    
    // Add variables for state caching
    var $xblocksContainer = $('#seq_content');
    var xblockId = settings.location;
    var stateId = xblockId + '_dialogsq_state';
    var cachedAnswersId = xblockId + '_dialogsq_answers';
    var cachedIndicatorClassId = xblockId + '_dialogsq_indicator_class';
    var cachedAttemptsId = xblockId + '_dialogsq_attempts';
    var cachedMaxAttemptsId = xblockId + '_dialogsq_max_attempts';
    var cachedScoreId = xblockId + '_dialogsq_score';
    var cachedShowCorrectnessId = xblockId + '_dialogsq_show_correctness';
    var cachedShowAnswerId = xblockId + '_dialogsq_show_answer';

    function updateText(result) {
        console.log('DialogsQuestions updateText:', result);
        
        // Cache state for page navigation
        $xblocksContainer.data(cachedIndicatorClassId, result.indicator_class);
        $xblocksContainer.data(cachedAttemptsId, result.attempts);
        $xblocksContainer.data(cachedMaxAttemptsId, result.max_attempts);
        $xblocksContainer.data(cachedScoreId, result.score);
        $xblocksContainer.data(cachedShowCorrectnessId, result.show_correctness);
        $xblocksContainer.data(cachedShowAnswerId, result.show_answer);
        
        // Save student answers from inputs and dropdowns
        var student_answers = {};
        $element.find('.inputdialogo').each(function() {
            student_answers[$(this).attr('question-id')] = $(this).val();
        });
        $element.find('.dropdowndialogo').each(function() {
            student_answers[$(this).attr('question-id')] = $(this).val();
        });
        $xblocksContainer.data(cachedAnswersId, student_answers);
        
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
                var mostrar_resp = '<button class="button_show_answers"><span class="icon fa fa-info-circle" aria-hidden="true"></span><br><span>Mostrar<br>Respuesta</span></button>';
                $element.find('.responder').append(mostrar_resp);
                clickShowAnswers();
            }
        }

        buttonSubmit.html("<span>" + buttonSubmit[0].dataset.value + "</span>");
    }

    function updateTextShowAnsers(result) {
        $ticket = '<img src="'+settings.image_path+'correct-icon.png" width="13px"/>';
        $cruz = '<img src="'+settings.image_path+'incorrect-icon.png" width="13px"/>';
        $obj = $element.find('.dialogsq_block');
        $obj.find('.showing_answers').remove();
            $.each($obj.find(".inputdialogo"), function(j,v){
                $img = $cruz;
                
                let prei_inputs = (result.answers[$(v).attr('question-id')]).replace("<span></span>","")
                ans_inputs = (prei_inputs.replace("[_[i]_]","")).split("_")
                input_resp = ""

                ans_inputs.forEach(
                    function(ans){
                        if( ans.trim() == $(v).val().trim() ) {
                            $img = $ticket;
                        }
                        input_resp += ans + " o "
                    }
                );

                input_resp += "+_punto*"
                input_resp = input_resp.replace("o +_punto*"," ")

                $(v).after('<span class="showing_answers"> &nbsp;'+$img+'&nbsp;<strong>Respuesta:</strong> '+ input_resp +'&nbsp; </span>');
            })
            $.each($obj.find(".dropdowndialogo"), function(j,v){
                $img = $cruz;
                console.log(result.answers[$(v).attr('question-id')]+" "+$(v).val());
                if ( (result.answers[$(v).attr('question-id')]).replace("[_[s]_]","") == $(v).val())
                    $img = $ticket;
                $(v).after('<span class="showing_answers"> &nbsp;'+$img+'&nbsp;<strong>Respuesta:</strong> '+ result.answers[$(v).attr('question-id')].replace("[_[s]_]","") +'&nbsp; </span>');
            })
    }

    $(function ($) {
        console.log('DialogsQuestions initializing for XBlock:', xblockId);

        findquestions($element.find('.dialogo'));
        writeStudentAnswers();
        
        // Restore cached state if available
        if ($xblocksContainer.data(cachedIndicatorClassId) !== undefined) {
            console.log('Found cached state for DialogsQuestions XBlock:', xblockId);
            console.log('Cached indicator class:', $xblocksContainer.data(cachedIndicatorClassId));
            console.log('Cached attempts:', $xblocksContainer.data(cachedAttemptsId));
            console.log('Cached max attempts:', $xblocksContainer.data(cachedMaxAttemptsId));
            console.log('Cached score:', $xblocksContainer.data(cachedScoreId));
            
            // Restore visual state
            var indicator_class = $xblocksContainer.data(cachedIndicatorClassId);
            var attempts = $xblocksContainer.data(cachedAttemptsId);
            var max_attempts = $xblocksContainer.data(cachedMaxAttemptsId);
            var score = $xblocksContainer.data(cachedScoreId);
            var show_correctness = $xblocksContainer.data(cachedShowCorrectnessId);
            var show_answer = $xblocksContainer.data(cachedShowAnswerId);
            var student_answers = $xblocksContainer.data(cachedAnswersId);
            
            // Apply indicator class
            statusDiv.removeClass('correct');
            statusDiv.removeClass('incorrect');
            statusDiv.removeClass('unanswered');
            statusDiv.addClass(indicator_class);
            
            // Restore student answers to inputs and dropdowns
            if (student_answers) {
                console.log('Restoring student answers:', student_answers);
                for (var question_id in student_answers) {
                    $element.find('[question-id="'+question_id+'"]').val(student_answers[question_id]);
                }
            }
            
            // Set submission feedback
            if (max_attempts > 0) {
                subFeedback.text('Has realizado '+attempts+' de '+max_attempts+' intentos');
                if (attempts >= max_attempts) {
                    buttonSubmit.attr("disabled", true);
                    
                    // Add show answers button if needed
                    if (show_answer == 'Finalizado' && !$element.find('.button_show_answers').length && show_correctness != 'never') {
                        var mostrar_resp = '<button class="button_show_answers"><span class="icon fa fa-info-circle" aria-hidden="true"></span><br><span>Mostrar<br>Respuesta</span></button>';
                        $element.find('.responder').append(mostrar_resp);
                        clickShowAnswers();
                    }
                }
            }
            
            // Set notification message based on score
            if (show_correctness != 'never') {
                if (score >= 1) {
                    $element.find('.notificacion').html('');
                    $element.find('.notificacion').removeClass('incorrecto');
                    $element.find('.notificacion').removeClass('dontshowcorrectness');
                    $element.find('.notificacion').addClass('correcto');
                    $element.find('.notificacion.correcto').html('<img src="'+settings.image_path+'correct-icon.png"/> ¡Respuesta Correcta!');
                } else if (attempts > 0) {
                    $element.find('.notificacion').html('');
                    $element.find('.notificacion').removeClass('correcto');
                    $element.find('.notificacion').removeClass('dontshowcorrectness');
                    $element.find('.notificacion').addClass('incorrecto');
                    if (score > 0) {
                        $element.find('.notificacion.incorrecto').html('<img src="'+settings.image_path+'partial-icon.png"/> Respuesta parcialmente correcta');
                    } else {
                        $element.find('.notificacion.incorrecto').html('<img src="'+settings.image_path+'incorrect-icon.png"/> Respuesta Incorrecta');
                    }
                }
            } else if (attempts > 0) {
                $element.find('.notificacion').html('');
                $element.find('.notificacion').removeClass('correcto');
                $element.find('.notificacion').removeClass('incorrecto');
                $element.find('.notificacion').addClass('dontshowcorrectness');
                $element.find('.notificacion.dontshowcorrectness').html('<span class="icon fa fa-info-circle" aria-hidden="true"></span>Respuesta enviada.');
            }
        } else {
            console.log('No cached state found for DialogsQuestions XBlock:', xblockId);
        }
        
        widthInput();
        actionkeyInput();
        clickSubmit();
        clickShowAnswers();
        clickEnableSubmit();

        var dialogquestid = "dialog_question_" + settings.location;
		renderMathForSpecificElements(dialogquestid);
    });

    function renderMathForSpecificElements(id) {
        //console.log("Render Mathjax in " + id);
        if (typeof MathJax !== "undefined") {
            var $dialog = $('#' + id);
            if ($dialog.length) {
                $dialog.find('.dialogo').each(function (index, diagelem) {
                    //console.log("encontrado")
                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, diagelem]);
                });
            }
        } else {
            console.warn("MathJax no está cargado.");
        }
    }

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
            
            console.log('Submitting answers for DialogsQuestions XBlock:', xblockId, student_answers);
            
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
        if($element.find('.status').hasClass('unanswered')){
            buttonSubmit = $element.find('.submit');
            $element.find('input').on('keyup', function(){
                if($element.find('.status').hasClass('unanswered')){
                    buttonSubmit.attr("disabled", false);
                }
            });
            $element.find('select').on('change', function(){
                if($element.find('.status').hasClass('unanswered')){
                    buttonSubmit.attr("disabled", false);
                }
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
