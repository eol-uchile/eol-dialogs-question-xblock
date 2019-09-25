import pkg_resources

from django.template import Context, Template

from xblock.core import XBlock
from xblock.fields import Integer, Scope, String, Boolean, Dict, Float
from xblock.fragment import Fragment
from xblockutils.studio_editable import StudioEditableXBlockMixin

# Make '_' a no-op so we can scrape strings
_ = lambda text: text


class DialogsQuestionsXBlock(StudioEditableXBlockMixin, XBlock):

    display_name = String(
        display_name=_("Display Name"),
        help=_("Display name for this module"),
        default="Dialogs with Questions XBlock",
        scope=Scope.settings,
    )

    icon_class = String(
        default="other",
        scope=Scope.settings,
    )

    image_url = String(
        display_name=_("URL del personaje"),
        help=_("Indica la URL a la imagen del personaje en el dialogo"),
        default="https://static.sumaysigue.uchile.cl/cmmeduformacion/produccion/assets/img/diag_aldo.png",
        scope=Scope.settings,
    )

    background_color = String(
        display_name=_("Color de fondo"),
        help=_("Color del contenedor del dialogo"),
        default="#F8E37B",
        scope=Scope.settings,
    )

    text_color = String(
        display_name=_("Color del texto"),
        help=_("Color del texto del dialogo"),
        default="#000000",
        scope=Scope.settings,
    )

    side = String(
        display_name = _("Posicion"),
        help = _("Indica la posicion del dialogo"),
        default = "Izquierda",
        values = ["Izquierda", "Derecha"],
        scope = Scope.settings
    )

    content = String(
        display_name="Contenido del dialogo", 
        multiline_editor='html', 
        resettable_editor=False,
        default="<p>Contenido del dialogo.</p>", 
        scope=Scope.settings,
        help=_("Indica el contenido del dialogo, si se quieren incluir entradas de texto," 
            "usar el formato &lt;span class='inputdialogo'&gt;respuesta correcta&lt;/span&gt; y si se quieren "
            "incluir dropdowns &lt;span class='dropdowndialogo'&gt;opcion incorrecta,(opcioncorrecta),opcion incorrecta&lt;/span&gt;"
        )
    )

    answers = Dict(
        help=_(
            'Respuestas de las preguntas'
        ),
        default={},
        scope=Scope.settings,
    )

    student_answers = Dict(
        help=_(
            'Respuestas del estudiante a las preguntas'
        ),
        default={},
        scope=Scope.user_state,
    )

    max_attempts = Integer(
        display_name=_('Nro de Intentos'),
        help=_(
            'Nro de veces que el estudiante puede intentar responder'
        ),
        default=2,
        values={'min': 1},
        scope=Scope.settings,
    )

    weight = Integer(
        display_name='Weight',
        help='Entero que representa el peso del problema',
        default=1,
        values={'min': 0},
        scope=Scope.settings,
    )

    attempts = Integer(
        default=0,
        scope=Scope.user_state,
    )

    show_answers = Boolean(
        display_name='Mostrar Respuesta',
        help="Mostrar boton de mostrar respuestas", 
        default=False,
        scope=Scope.settings)

    score = Float(
        default=0.0,
        scope=Scope.user_state,
    )

    has_score = True

    editable_fields = ('image_url', 'background_color', 'text_color', 'side', 'content', 'max_attempts', 'weight', 'show_answers', 'answers')

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def student_view(self, context=None):
        context_html = self.get_context()
        template = self.render_template('static/html/dialogsq.html', context_html)
        frag = Fragment(template)
        frag.add_css(self.resource_string("static/css/dialogsq.css"))
        frag.add_javascript(self.resource_string("static/js/src/utils.js"))
        frag.add_javascript(self.resource_string("static/js/src/dialogsq.js"))
        settings = {
            'image_path': self.runtime.local_resource_url(self, 'public/images/')
        }
        frag.initialize_js('DialogsQuestionsXBlock', json_args=settings)
        return frag
        
    def studio_view(self, context):
        """
        Render a form for editing this XBlock
        """
        context = {'fields': []}
        # Build a list of all the fields that can be edited:
        for field_name in self.editable_fields:
            field = self.fields[field_name]
            assert field.scope in (Scope.content, Scope.settings), (
                "Only Scope.content or Scope.settings fields can be used with "
                "StudioEditableXBlockMixin. Other scopes are for user-specific data and are "
                "not generally created/configured by content authors in Studio."
            )
            field_info = self._make_field_info(field_name, field)
            if field_info is not None:
                context["fields"].append(field_info)
        template = self.render_template('static/html/studio_edit.html', context)
        fragment = Fragment(template)
        fragment.add_javascript(self.resource_string("static/js/src/utils.js"))
        fragment.add_javascript(self.resource_string("static/js/src/studio_edit.js"))
        fragment.initialize_js('StudioEditableXBlockMixin')
        return fragment

    def get_context(self):
        return {
            'xblock': self,
            'indicator_class': self.get_indicator_class(),
            'image_path' : self.runtime.local_resource_url(self, 'public/images/'),
            'location': str(self.location).split('@')[-1]
        }

    def render_template(self, template_path, context):
        template_str = self.resource_string(template_path)
        template = Template(template_str)
        return template.render(Context(context))


    @XBlock.json_handler
    def savestudentanswers(self, data, suffix=''):  # pylint: disable=unused-argument
        self.student_answers = data['student_answers']
        #check correctness
        buenas = 0.0
        malas = 0.0
        total = len(self.student_answers)

        for k,v in self.student_answers.items():
            if v == self.answers[k]:
                buenas += 1
        
        malas = (total-buenas)

        #update score and classes
        self.score = float(buenas/(malas+buenas))
        ptje = self.weight*self.score
        try:
            self.runtime.publish(
                self,
                'grade',
                {
                    'value': ptje,
                    'max_value': self.weight
                }
            )
            self.attempts += 1
        except IntegrityError:
            pass
        #return to show score
        return {'max_attempts': self.max_attempts, 'attempts': self.attempts, 'score':self.score, 'indicator_class': self.get_indicator_class() }

    @XBlock.json_handler
    def getanswers(self, data, suffix=''):
        return {'answers': self.answers}

    def get_indicator_class(self):
        indicator_class = 'unanswered'
        if self.attempts:
            if self.score >= 1:
                indicator_class = 'correct'
            else:
                indicator_class = 'incorrect'
        return indicator_class

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("DialogsQuestionsXBlock",
             """<dialogsquestionsxblock/>
             """),
            ("Multiple DialogsQuestionsXBlock",
             """<vertical_demo>
                <dialogsquestionsxblock/>
                <dialogsquestionsxblock/>
                <dialogsquestionsxblock/>
                </vertical_demo>
             """),
        ]
