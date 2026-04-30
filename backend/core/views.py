from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user account."""
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'error': 'username et password sont requis.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if email and User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Cet email est déjà utilisé.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Ce nom d\'utilisateur est déjà pris.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(username=username, email=email, password=password)
    return Response(
        {'message': f'Compte créé avec succès pour {username}.', 'id': user.id},
        status=status.HTTP_201_CREATED
    )
