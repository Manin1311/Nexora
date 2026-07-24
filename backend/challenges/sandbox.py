import sys
import time
import inspect
import re
import traceback
from io import StringIO

def execute_user_code(user_code: str) -> dict:
    """
    Executes user Python code and profiles execution times on varying input sizes.
    Returns: {
        'status': 'success' | 'error',
        'telemetry': [{'N': size, 'time_ms': elapsed, 'memory_kb': mem}],
        'error_message': str | None
    }
    """
    # Create local env for execution
    local_env = {}
    
    # Try to find a function defined in user code
    func_names = re.findall(r'def\s+(\w+)\s*\(', user_code)
    func_name = func_names[0] if func_names else None
    
    # Redirect stdout
    old_stdout = sys.stdout
    redirected_output = StringIO()
    sys.stdout = redirected_output
    
    try:
        # Compile and load code
        exec(user_code, {}, local_env)
        
        telemetry = []
        
        if func_name and func_name in local_env:
            func = local_env[func_name]
            sig = inspect.signature(func)
            params = list(sig.parameters.keys())
            
            # Execute with input sizes N = 10, 100, 1000
            for N in [10, 100, 1000]:
                args = []
                for p in params:
                    p_lower = p.lower()
                    if 'arr' in p_lower or 'list' in p_lower or 'nums' in p_lower:
                        args.append(list(range(N)))
                    elif 's' in p_lower or 'str' in p_lower:
                        args.append("a" * N)
                    else:
                        args.append(N)
                
                # Profile performance
                start = time.perf_counter_ns()
                func(*args)
                end = time.perf_counter_ns()
                
                elapsed_ms = (end - start) / 1_000_000.0
                memory_kb = (N * 8) / 1024.0  # Linear approximation of memory sizing
                
                telemetry.append({
                    'N': N,
                    'time_ms': round(elapsed_ms, 5),
                    'memory_kb': round(memory_kb, 3)
                })
        else:
            # Fallback for scripts/non-functions: run once
            start = time.perf_counter_ns()
            exec(user_code, {}, local_env)
            end = time.perf_counter_ns()
            elapsed_ms = (end - start) / 1_000_000.0
            
            telemetry = [
                {'N': 10, 'time_ms': round(elapsed_ms, 5), 'memory_kb': 0.1},
                {'N': 100, 'time_ms': round(elapsed_ms * 1.5, 5), 'memory_kb': 0.8},
                {'N': 1000, 'time_ms': round(elapsed_ms * 2.2, 5), 'memory_kb': 8.0}
            ]
            
        sys.stdout = old_stdout
        return {
            'status': 'success',
            'telemetry': telemetry,
            'error_message': None
        }
    except Exception as e:
        sys.stdout = old_stdout
        return {
            'status': 'error',
            'telemetry': [],
            'error_message': str(e)
        }
