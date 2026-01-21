from flask import Blueprint, jsonify 
encryption_bp = Blueprint('encryption', __name__) 
@encryption_bp.route('/test') 
def encryption_test(): 
    return jsonify({'encryption': 'demo'}) 
