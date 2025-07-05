import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from services.lucro import enviar_lucro_para_operador

def test_enviar_lucro_para_operador():
    assert enviar_lucro_para_operador(100) == True

