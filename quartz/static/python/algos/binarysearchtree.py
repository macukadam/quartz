import unittest


class Node:
    def __init__(self, key):
        self.left = None
        self.right = None
        self.val = key

    @staticmethod
    def insert(root, key):
        if root is None:
            return Node(key)
        else:
            if key < root.val:
                root.left = Node.insert(root.left, key)
            else:
                root.right = Node.insert(root.right, key)
        return root

    @staticmethod
    def create_bst(values):
        root = None
        for value in values:
            root = Node.insert(root, value)
        return root

    def inorder_print(self):
        def inorder(node):
            if node:
                inorder(node.left)
                result.append(str(node.val))
                inorder(node.right)

        result = []
        inorder(self)
        print(" -> ".join(result))


class TestBinarySearchTree(unittest.TestCase):
    def test_bst_insertion_and_inorder_print(self):
        values = [5, 3, 7, 2, 4, 6, 8]
        bst_root = Node.create_bst(values)

        from io import StringIO
        import sys

        captured_output = StringIO()
        sys.stdout = captured_output

        bst_root.inorder_print()

        sys.stdout = sys.__stdout__

        self.assertEqual(
            captured_output.getvalue().strip(), "2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8"
        )


if __name__ == "__main__":
    unittest.main()
