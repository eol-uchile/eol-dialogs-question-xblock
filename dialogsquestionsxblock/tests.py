"""
Module To Test DialogsQuestions XBlock
"""
import json
import unittest

from mock import MagicMock, Mock

from opaque_keys.edx.locations import SlashSeparatedCourseKey

from xblock.field_data import DictFieldData

from .dialogsquestionsxblock import DialogsQuestionsXBlock


class TestRequest(object):
    # pylint: disable=too-few-public-methods
    """
    Module helper for @json_handler
    """
    method = None
    body = None
    success = None

class DialogsQuestionsXblockTestCase(unittest.TestCase):
    # pylint: disable=too-many-instance-attributes, too-many-public-methods
    """
    A complete suite of unit tests for the DialogsQuestions XBlock
    """

    @classmethod
    def make_an_xblock(cls, **kw):
        """
        Helper method that creates a DialogsQuestions XBlock
        """
        course_id = SlashSeparatedCourseKey('foo', 'bar', 'baz')
        runtime = Mock(
            course_id=course_id,
            service=Mock(
                return_value=Mock(_catalog={}),
            ),
        )
        scope_ids = Mock()
        field_data = DictFieldData(kw)
        xblock = DialogsQuestionsXBlock(runtime, field_data, scope_ids)
        xblock.xmodule_runtime = runtime
        xblock.location = 'asdf'
        return xblock

    def setUp(self):
        """
        Creates an xblock
        """
        self.xblock = DialogsQuestionsXblockTestCase.make_an_xblock()

    def test_validate_field_data(self):
        """
        Reviso si se creo bien el xblock por defecto, sin intentos y sin respuestas.
        """
        self.assertEqual(self.xblock.image_url, 'https://static.sumaysigue.uchile.cl/cmmeduformacion/produccion/assets/img/diag_aldo.png')
        self.assertEqual(self.xblock.background_color, '#F8E37B')
        self.assertEqual(self.xblock.text_color, '#000000')
        self.assertEqual(self.xblock.side, 'Izquierda')
        self.assertEqual(self.xblock.text, '<p>Contenido del dialogo.</p>')
        self.assertEqual(self.xblock.score, 0.0)
        self.assertEqual(self.xblock.attempts, 0)
        self.assertEqual(self.xblock.weight, 1)
        self.assertEqual(self.xblock.get_indicator_class(), 'unanswered')
        self.assertEqual(self.xblock.get_show_correctness(), 'always')

    def test_edit_block(self):
        """
        Reviso que este funcionando el submit studio edits
        """
        #pruebo agregar preguntas
        request = TestRequest()
        request.method = 'POST'

        data = json.dumps({'values':{'text': 'Agrego una pregunta con input <span class="inputdialogo">asdf</span> y una con dropdown <span class="dropdowndialogo">o1,o2,(o3),o4</span>'},
                            'defaults':{}
                            })
        request.body = data.encode('utf-8')
        response = self.xblock.submit_studio_edits(request)
        self.assertEqual(self.xblock.text, 'Agrego una pregunta con input <span class="inputdialogo">asdf</span> y una con dropdown <span class="dropdowndialogo">o1,o2,(o3),o4</span>')

    def test_student_view(self):
        # pylint: disable=protected-access
        """
        Checks the student view for student specific instance variables.
        """
        #agrego preguntas
        request = TestRequest()
        request.method = 'POST'

        data = json.dumps({'values':{'text': 'Agrego una pregunta con input <span class="inputdialogo">asdf</span> y una con dropdown <span class="dropdowndialogo">o1,o2,(o3),o4</span>'},
                            'defaults':{}
                            })
        request.body = data.encode('utf-8')
        response = self.xblock.submit_studio_edits(request)

        student_view = self.xblock.student_view()
        student_view_html = student_view.content
        self.assertIn(self.xblock.text, student_view_html)

    def test_answers(self):
        # pylint: disable=protected-access
        """
        Checks the student view for student specific instance variables.
        """
        #agrego preguntas
        request = TestRequest()
        request.method = 'POST'

        data = json.dumps({'values':{'text': 'Agrego una pregunta con input <span class="inputdialogo">asdf</span> y una con dropdown <span class="dropdowndialogo">o1,o2,(o3),o4</span>',
                                    'answers': {1: "asdf", 2: "o3"},
                                    'max_attempts': 5
                                    },
                            'defaults':{}
                            })
        request.body = data.encode('utf-8')
        response = self.xblock.submit_studio_edits(request)
        self.assertEqual(self.xblock.answers, {'1': "asdf", '2': "o3"})

        #pruebo respuestas buenas y malas con el problema con nuevas respuestas
        request = TestRequest()
        request.method = 'POST'

        data = json.dumps({'student_answers': {'1': "asdf", '2': "o3"}})
        request.body = data.encode('utf-8')
        response = self.xblock.savestudentanswers(request)
        self.assertEqual(response.json_body['indicator_class'], 'correct')
        self.assertEqual(response.json_body['attempts'], 1)

        data = json.dumps({'student_answers': {'1': "fdsa", '2': "o3"}})
        request.body = data.encode('utf-8')
        response = self.xblock.savestudentanswers(request)
        self.assertEqual(response.json_body['indicator_class'], 'incorrect')
        self.assertEqual(response.json_body['attempts'], 2)

        data = json.dumps({'student_answers': {'1': "asdf"}})
        request.body = data.encode('utf-8')
        response = self.xblock.savestudentanswers(request)
        self.assertEqual(response.json_body['indicator_class'], 'incorrect')
        self.assertEqual(response.json_body['attempts'], 3)

        data = json.dumps({'student_answers': {'1': "asdf", '2': "o2"}})
        request.body = data.encode('utf-8')
        response = self.xblock.savestudentanswers(request)
        self.assertEqual(response.json_body['indicator_class'], 'incorrect')
        self.assertEqual(response.json_body['attempts'], 4)

        data = json.dumps({'student_answers': {'1': "qwerty", '2': "o1"}})
        request.body = data.encode('utf-8')
        response = self.xblock.savestudentanswers(request)
        self.assertEqual(response.json_body['indicator_class'], 'incorrect')
        self.assertEqual(response.json_body['attempts'], 5)