"""Setup for dialogsquestionsxblock XBlock."""



import os

from setuptools import setup


def package_data(pkg, roots):
    """Generic function to find package_data.

    All of the files under each of the `roots` will be declared as package
    data for package `pkg`.

    """
    data = []
    for root in roots:
        for dirname, _, files in os.walk(os.path.join(pkg, root)):
            for fname in files:
                data.append(os.path.relpath(os.path.join(dirname, fname), pkg))

    return {pkg: data}


setup(
    name='dialogsquestionsxblock-xblock',
    version='1.0.0',
    description='dialogsquestionsxblock XBlock', 
    license='AGPL v3',
    packages=[
        'dialogsquestionsxblock',
    ],
    install_requires=[
        'XBlock',
    ],
    entry_points={
        'xblock.v1': [
            'dialogsquestionsxblock = dialogsquestionsxblock:DialogsQuestionsXBlock',
        ]
    },
    package_data=package_data("dialogsquestionsxblock", ["static", "public"]),
)
