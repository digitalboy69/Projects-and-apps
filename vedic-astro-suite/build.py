# Entry point kept at the project root so `python3 build.py` keeps working. The real code is in tools/.
import runpy, os, sys
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tools', 'build.py'), run_name='__main__')
